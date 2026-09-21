(() => {
  'use strict';

  const ENDPOINT = 'https://img402.dev/api/free';
  const MAX_BYTES = 10 * 1024 * 1024;
  const PERMANENT_BYTES = 1 * 1024 * 1024;
  const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

  const $ = s => document.querySelector(s);
  const fileInput = $('#file');
  const drop = $('#drop');
  const previewBox = $('#previewBox');
  const preview = $('#preview');
  const fileName = $('#fileName');
  const fileSize = $('#fileSize');
  const retentionHint = $('#retentionHint');
  const uploadBtn = $('#upload');
  const status = $('#status');
  const progress = $('#progress');
  const result = $('#result');
  const toast = $('#toast');

  let selectedFile = null;
  let previewUrl = '';

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function setStatus(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1400);
  }

  function retentionText(file) {
    return file.size <= PERMANENT_BYTES
      ? '免费永久保存'
      : '免费保存 30 天';
  }

  function choose(file) {
    if (!file) return;

    if (!ALLOWED.has(file.type)) {
      setStatus('仅支持 PNG、JPG、GIF、WebP。', true);
      return;
    }

    if (file.size > MAX_BYTES) {
      setStatus('图片不能超过 10 MB。', true);
      return;
    }

    selectedFile = file;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);

    preview.src = previewUrl;
    fileName.textContent = file.name;
    fileSize.textContent = humanSize(file.size) + ' · ' + file.type;
    retentionHint.textContent = retentionText(file);

    previewBox.classList.remove('hidden');
    result.classList.add('hidden');
    setStatus('准备好了，点击“立即上传”。');
  }

  drop.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => choose(fileInput.files && fileInput.files[0]));

  ['dragenter', 'dragover'].forEach(type => {
    drop.addEventListener(type, e => {
      e.preventDefault();
      drop.classList.add('drag');
    });
  });

  ['dragleave', 'drop'].forEach(type => {
    drop.addEventListener(type, e => {
      e.preventDefault();
      drop.classList.remove('drag');
    });
  });

  drop.addEventListener('drop', e => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    choose(file);
  });

  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      setStatus('请先选择一张图片。', true);
      return;
    }

    uploadBtn.disabled = true;
    progress.classList.remove('hidden');
    result.classList.add('hidden');
    setStatus('正在上传到公共图床…');

    try {
      const form = new FormData();
      form.append('image', selectedFile, selectedFile.name);

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        body: form
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const code = data && (data.error || data.code);
        const message = data && data.message;
        throw new Error(message || code || ('HTTP ' + response.status));
      }

      if (!data.url) {
        throw new Error('服务没有返回图片 URL');
      }

      const direct = data.url;
      const alt = selectedFile.name.replace(/\.[^.]+$/, '');

      $('#directUrl').value = direct;
      $('#markdownUrl').value = `![${alt}](${direct})`;
      $('#htmlUrl').value = `<img src="${direct}" alt="${alt}">`;
      $('#openImage').href = direct;
      $('#uploadedPreview').src = direct;

      if (data.expiresAt) {
        const d = new Date(data.expiresAt);
        $('#expiry').textContent = '免费链接有效至 ' + d.toLocaleString();
      } else {
        $('#expiry').textContent = '永久链接 · 无到期时间';
      }

      result.classList.remove('hidden');
      setStatus('上传完成。');
      showToast('上传成功');
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      const msg = err && err.message ? err.message : String(err);

      if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
        setStatus('上传失败：浏览器无法连接 img402 上传接口，请稍后重试。', true);
      } else if (/daily_limit/i.test(msg)) {
        setStatus('上传失败：公共免费额度暂时用完，请稍后再试。', true);
      } else {
        setStatus('上传失败：' + msg, true);
      }
    } finally {
      uploadBtn.disabled = false;
      progress.classList.add('hidden');
    }
  });

  document.addEventListener('click', async e => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;

    const input = $('#' + button.dataset.copy);
    if (!input) return;

    try {
      await navigator.clipboard.writeText(input.value);
      showToast('已复制');
    } catch {
      input.select();
      document.execCommand('copy');
      showToast('已复制');
    }
  });
})();
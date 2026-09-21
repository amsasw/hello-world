(() => {
  'use strict';

  const OWNER = 'amsasw';
  const REPO = 'hello-world';
  const BRANCH = 'main';
  const MAX_BYTES = 10 * 1024 * 1024;

  const $ = s => document.querySelector(s);
  const fileInput = $('#file');
  const drop = $('#drop');
  const previewBox = $('#previewBox');
  const preview = $('#preview');
  const fileName = $('#fileName');
  const fileSize = $('#fileSize');
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

  function safeName(name) {
    const dot = name.lastIndexOf('.');
    const ext = dot > -1 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
    const base = (dot > -1 ? name.slice(0, dot) : name)
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 55) || 'image';
    return base + ext;
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

  function choose(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('请选择图片文件。', true);
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
    fileSize.textContent = humanSize(file.size) + ' · ' + (file.type || 'image');
    previewBox.classList.remove('hidden');
    result.classList.add('hidden');
    setStatus('准备上传。');
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || '');
        resolve(value.slice(value.indexOf(',') + 1));
      };
      reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
      reader.readAsDataURL(file);
    });
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
    const token = $('#token').value.trim();
    if (!selectedFile) return setStatus('请先选择一张图片。', true);
    if (!token) return setStatus('请先输入 GitHub Token。', true);

    uploadBtn.disabled = true;
    progress.classList.remove('hidden');
    result.classList.add('hidden');
    setStatus('正在上传到 GitHub…');

    try {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
      const path = `images/${y}/${m}/${stamp}-${safeName(selectedFile.name)}`;
      const content = await toBase64(selectedFile);

      const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': 'Bearer ' + token,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'upload: ' + selectedFile.name,
          content,
          branch: BRANCH
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data && data.message ? data.message : 'HTTP ' + response.status;
        throw new Error(message);
      }

      const raw = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
      const cdn = `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}/${path}`;
      const alt = selectedFile.name.replace(/\.[^.]+$/, '');

      $('#cdnUrl').value = cdn;
      $('#rawUrl').value = raw;
      $('#markdownUrl').value = `![${alt}](${cdn})`;
      $('#htmlUrl').value = `<img src="${cdn}" alt="${alt}">`;
      $('#openImage').href = raw;

      result.classList.remove('hidden');
      setStatus('上传完成。');
      showToast('上传成功');
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      setStatus('上传失败：' + msg, true);
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
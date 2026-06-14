document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('htmx:responseError', (e) => {
    const target = e.detail.target
    if (target) target.innerHTML = '<span class="text-red-500 text-sm">Ошибка сервера</span>'
  })
  document.body.addEventListener('htmx:afterRequest', (e) => {
    const resp = e.detail.xhr
    if (resp.status === 401) window.location.href = '/admin/login'
  })
})

function handleHtmxLogin(event) {
  const resp = JSON.parse(event.detail.xhr.responseText)
  if (resp.ok) window.location.href = '/admin/projects'
  else {
    document.getElementById('result').innerHTML = '<p class="text-red-500 text-sm mt-2">Неверное имя или пароль</p>'
  }
}
const createRequest = async (options) => {
  const { url, method = 'GET', body = null, callback = () => {} } = options;

  const params = { method };
  if (body) {
    params.headers = { 'Content-Type': 'application/json' };
    params.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, params);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // сервер прислал не JSON (например, HTML-страницу)
      callback(new Error(`Некорректный ответ сервера (${response.status})`), null);
      return;
    }

    if (response.ok) {
      callback(null, data);
    } else {
      callback(new Error(data.message || 'Ошибка сервера'), null);
    }
  } catch (e) {
    callback(new Error('Сеть недоступна: проверьте, что backend запущен'), null);
  }
};

export default createRequest;

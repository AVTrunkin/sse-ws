import ChatAPI from './api/ChatAPI';

const SERVER_URL = 'http://localhost:3000';

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
    this.user = null;
    this.users = [];
  }

  init() {
    this.buildDOM();
    this.bindToDOM();
    this.registerEvents();
    this.subscribeOnEvents();

    window.addEventListener('beforeunload', () => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'exit', user: this.user }));
      }
    });
  }

  buildDOM() {
    this.container.innerHTML = `
      <div class="modal__form active">
        <div class="modal__background"></div>
        <div class="modal__content">
          <div class="modal__header">Выберите псевдоним</div>
          <div class="modal__body">
            <form class="modal__form-body">
              <div class="form__group">
                <label class="form__label">Никнейм</label>
                <input class="form__input" name="name" required>
                <div class="form__hint hidden"></div>
              </div>
            </form>
          </div>
          <div class="modal__footer">
            <div class="modal__ok" data-role="ok">Войти</div>
          </div>
        </div>
      </div>

      <div class="container hidden" data-role="chat">
        <h1 class="chat__header" style="display:none;">Чат</h1>
        
        <div class="chat__container">
          <aside class="chat__userlist">
            <h2 style="margin:0 0 15px 0; font-size:16px; color:#555;">Участники</h2>
          </aside>

          <section class="chat__area">
            <div class="chat__messages-container">
              <!-- Сюда JS будет вставлять сообщения -->
            </div>
            
            <div class="chat__messages-input">
              <form class="form">
                <div class="form__group" style="margin:0;">
                  <input class="form__input" name="message" placeholder="Type your message here" style="width:100%; border-radius:20px; padding:10px 15px;">
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>`;
  }

  bindToDOM() {
    this.modal = this.container.querySelector('.modal__form');
    this.modalName = this.container.querySelector('[name="name"]');
    this.modalHint = this.container.querySelector('.form__hint');

    this.chatEl = this.container.querySelector('[data-role="chat"]');
    this.messagesContainer = this.container.querySelector('.chat__messages-container');
    this.userlist = this.container.querySelector('.chat__userlist');
    this.chatForm = this.container.querySelector('.chat__messages-input form');
    this.chatInput = this.container.querySelector('[name="message"]');
  }

  registerEvents() {
    this.modal.querySelector('.modal__ok').addEventListener('click', (e) => {
      e.preventDefault();
      const name = this.modalName.value.trim();
      if (name) this.onEnterChatHandler(name);
    });
    
    this.chatForm.addEventListener('submit', this.sendMessage.bind(this));
  }

  subscribeOnEvents() {}

  onEnterChatHandler(name) {
    this.api.checkNickname(name, (err, data) => {
      if (err) {
        this.modalHint.textContent = err.message || 'Ошибка соединения';
        this.modalHint.classList.remove('hidden');
        return;
      }
      
      this.user = data.user;
      this.openSocket();
    });
  }

  openSocket() {
    const wsUrl = SERVER_URL.replace(/^http/, 'ws');
    this.websocket = new WebSocket(wsUrl);

    this.websocket.addEventListener('open', () => {
      this.modal.classList.remove('active');
      this.chatEl.classList.remove('hidden');
      this.modalName.value = '';
      this.modalHint.classList.add('hidden');
    });

    this.websocket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'message':
          this.renderMessage(data);
          break;
        case 'users': 
          this.renderUsers(data.users); 
          break;
      }
      
      if (Array.isArray(data)) {
        this.renderUsers(data);
        return;
      }
      
      if (data.type === 'send') {
        this.renderMessage(data);
      }
    });
  }

  sendMessage(e) {
    e.preventDefault();
    const message = this.chatInput.value.trim();
    if (!message) return;

    this.websocket.send(JSON.stringify({
      type: 'send',
      message,
      user: this.user
    }));
    this.chatInput.value = '';
  }

  renderUsers(users) {
    if (!this.userlist) return; 
    this.userlist.innerHTML = '';

    users.forEach((user) => {
      const item = document.createElement('div');
      item.classList.add('chat__user');

      const avatar = document.createElement('div');
      avatar.style.cssText = `
        width: 32px; height: 32px;
        border-radius: 50%;
        border: 1px solid #ccc;
        display: inline-block;
        margin-right: 10px;
        vertical-align: middle;
        background-color: #f0f0f0;
      `;

      const name = document.createElement('span');
      name.style.verticalAlign = 'middle';
      name.textContent = user.name;

      item.appendChild(avatar);
      item.appendChild(name);
      this.userlist.appendChild(item);
    });
  }

  renderMessage({ message, user }) {
    const isMine = user.id === this.user.id;
    const wrapper = document.createElement('div');
    wrapper.classList.add('message__container');
    wrapper.classList.add(isMine
      ? 'message__container-yourself'
      : 'message__container-interlocutor');

   
    const date = new Date();
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('ru-RU');

    const header = document.createElement('div');
    header.classList.add('message__header');
    header.textContent = `${user.name}, ${timeStr} ${dateStr}`;

    const text = document.createElement('div');
    text.textContent = message;

    wrapper.appendChild(header);
    wrapper.appendChild(text);
    this.messagesContainer.appendChild(wrapper);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}
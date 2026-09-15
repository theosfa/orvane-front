

export default function Home() {
  return (
    <main id="top">
      {/* HERO */}
      <section className="hero" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <h1>
            Еда, деньги и будущее —<br />наконец в одном ритме
          </h1>
          <p className="hero-sub">
            Лад — это не ещё одно приложение. Это три, которые вы уже открываете
            каждый день, собранные в одно: что приготовить, сколько осталось до
            зарплаты и что вообще делать дальше.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#put">
              Начать бесплатно
            </a>
            <a className="btn btn-ghost" href="#stol">
              Посмотреть, как это работает
            </a>
          </div>
          <div className="hero-trio">
            <span className="trio-chip">Стол — еда и калории</span>
            <span className="trio-chip">Счёт — бюджет и траты</span>
            <span className="trio-chip">Путь — планы и задачи</span>
          </div>
        </div>
      </section>

      {/* FOOD MODULE */}
      <section id="stol">
        <div className="wrap module">
          <div>
            <span
              className="module-tag"
              style={{ background: 'var(--food-tint)', color: 'var(--food)' }}
            >
              Стол
            </span>
            <h2>Ужин без пятнадцати вкладок с рецептами</h2>
            <p className="module-body">
              Лад.Стол смотрит, что уже лежит в холодильнике, и предлагает, что из
              этого приготовить сегодня. Калории и БЖУ считаются сами — по
              фотографии тарелки или по рецепту, без ручного взвешивания гречки.
            </p>
            <p className="module-note">
              По воскресеньям Лад собирает меню на неделю и сразу формирует список
              покупок — по отделам магазина, а не по алфавиту.
            </p>
          </div>
          <div className="module-visual">
            <div className="food-menu">
              <div className="food-menu-row">
                <span>Овсянка с печёным яблоком и корицей</span>
                <span>340 ккал</span>
              </div>
              <div className="food-menu-row">
                <span>Боул с булгуром, нутом и тахини</span>
                <span>510 ккал</span>
              </div>
              <div className="food-menu-row">
                <span>Лосось на пару, спаржа, лимон</span>
                <span>460 ккал</span>
              </div>
              <div className="food-menu-row">
                <span>Творог с ягодами и мёдом</span>
                <span>210 ккал</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINANCE MODULE */}
      <section id="schet">
        <div className="wrap module reverse">
          <div className="module-visual">
            <div className="ledger">
              <div className="ledger-row">
                <span className="cat">Продукты</span>
                <span className="bar">
                  <i style={{ width: '72%' }} />
                </span>
                <span className="amt">18 400 ₽</span>
              </div>
              <div className="ledger-row">
                <span className="cat">Транспорт</span>
                <span className="bar">
                  <i style={{ width: '30%' }} />
                </span>
                <span className="amt">4 100 ₽</span>
              </div>
              <div className="ledger-row">
                <span className="cat">Развлечения</span>
                <span className="bar">
                  <i style={{ width: '46%' }} />
                </span>
                <span className="amt">7 600 ₽</span>
              </div>
              <div className="ledger-row">
                <span className="cat">Можно тратить сегодня</span>
                <span className="bar">
                  <i style={{ width: '58%' }} />
                </span>
                <span className="amt">1 260 ₽</span>
              </div>
            </div>
          </div>
          <div>
            <span
              className="module-tag"
              style={{ background: 'var(--finance-tint)', color: 'var(--finance)' }}
            >
              Счёт
            </span>
            <h2>Бюджет, который считает сам — и не молчит о лишнем</h2>
            <p className="module-body">
              Лад.Счёт подключается к картам и раскладывает траты по конвертам
              без ваших усилий. Каждое утро он честно говорит, сколько можно
              потратить сегодня, чтобы в конце месяца не занимать до зарплаты.
            </p>
            <p className="module-note">
              Крупная незапланированная трата — сразу видно, из какого месяца её
              придётся вычесть, а не сюрприз в конце месяца.
            </p>
          </div>
        </div>
      </section>

      {/* FUTURE MODULE */}
      <section id="put">
        <div className="wrap module">
          <div>
            <span
              className="module-tag"
              style={{ background: 'var(--future-tint)', color: 'var(--future)' }}
            >
              Путь
            </span>
            <h2>Большие цели, которые не теряются между дедлайнами</h2>
            <p className="module-body">
              Лад.Путь берёт то, что вы давно откладываете — «выучить испанский»,
              «накопить на квартиру», «найти новую работу» — и превращает в
              конкретную задачу на сегодня. Раз в неделю Лад показывает, куда вы
              на самом деле идёте, а не только что горит прямо сейчас.
            </p>
            <p className="module-note">
              Задачи из Стола и Счёта — купить продукты, отложить остаток —
              попадают в Путь сами, без переноса вручную.
            </p>
          </div>
          <div className="module-visual">
            <div className="path">
              <div className="path-item done">
                <span className="path-dot" />
                <div className="path-text">
                  <strong>Собрать список для сертификата B1</strong>
                  <span>Испанский · сделано во вторник</span>
                </div>
              </div>
              <div className="path-item done">
                <span className="path-dot" />
                <div className="path-text">
                  <strong>Отложить остаток бюджета — 1 260 ₽</strong>
                  <span>Накопления на квартиру · сегодня</span>
                </div>
              </div>
              <div className="path-item">
                <span className="path-dot" />
                <div className="path-text">
                  <strong>Записаться на пробное занятие</strong>
                  <span>Испанский · на этой неделе</span>
                </div>
              </div>
              <div className="path-item">
                <span className="path-dot" />
                <div className="path-text">
                  <strong>Обновить резюме</strong>
                  <span>Новая работа · через 3 дня</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="closing" style={{ borderBottom: 'none' }}>
        <div className="wrap">
          <h2>Один Лад вместо трёх открытых вкладок жизни</h2>
          <p className="closing-sub">
            Начните с любого модуля — остальные подключатся сами, когда
            понадобятся.
          </p>
          <div className="price-row">
            <div className="price-card">
              <div className="amount">0 ₽</div>
              <p>Стол, Счёт и Путь по отдельности, с ограничением на 20 задач и рецептов в месяц.</p>
            </div>
            <div className="price-card">
              <div className="amount">
                399 ₽<small> / мес</small>
              </div>
              <p>Полный ритм: всё синхронизировано, без ограничений и напоминаний об оплате.</p>
            </div>
          </div>
          <div className="hero-cta" style={{ marginTop: 40 }}>
            <a className="btn btn-primary" href="#top">
              Начать бесплатно
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">Лад · Стол, Счёт и Путь в одном приложении</div>
      </footer>


    </main>
  );
}

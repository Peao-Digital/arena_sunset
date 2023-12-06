$(document).ready(function () {
  const csrftoken = getCSRFToken();
  let storedInfo = {};

  const calendarEl = document.getElementById('calendar');

  const body = $("#agenda");
  const modal = $("#modal-form");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    buttonText: {
      prevYear: "&nbsp;&lt;&lt;&nbsp;",
      nextYear: "&nbsp;&gt;&gt;&nbsp;",
      today: "Hoje",
      month: "Mês",
      week: "Semana",
      day: "Dia"
    },
    locale: 'pt-br',
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    dateClick: function (info) {
      storedInfo.data = info.dateStr;
      carregar_professores(storedInfo.data);
      modal.modal("show");
    },
    dayMaxEventRows: true, // Adicione essa linha para limitar o número de eventos por linha
    eventTextColor: '#fff', // Defina a cor do texto do evento como branco
    contentHeight: 'auto', // Adicione essa linha para ajustar automaticamente a altura do calendário
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' }, // Adicione essa linha para formatar o horário do evento
    eventDisplay: 'block', // Adicione essa linha para exibir os eventos em blocos
  });

  const construirCardProfessor = (professor) => {
    return `
      <div class="col-md-6 col-lg-4 col-sm-12 mb-3">
        <div class="card custom-cards-agenda">
          <div class="card-body">
            <div class="foto">
              <img src="" class="img-professor"/>
            </div>
            <div class="div-nome">
              <h2>${professor.nome}</h2>
            </div>
            <div class="selecionavel">
              <button class="btn btn-new btn-select-professor" type="button" value="${professor.id}">Selecionar Professor</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const construirCardPacotes = (pacotes) => {
    return `
      <div class="col-md-6 col-lg-4 col-sm-12 mb-3">
        <div class="card custom-cards-agenda">
          <div class="card-body">
            <div class="div-nome">
              <h4>${pacotes.nome}</h4>
              <h4>R$ ${pacotes.valor}</h4>
              <h4>${pacotes.qtd_aulas_semana} Aulas</h4>
              <h4>${pacotes.qtd_participantes}</h4>
            </div>
            <div class="selecionavel">
              <button class="btn btn-new btn-select-pacotes" type="button" value="${pacotes.id}">Selecionar pacote</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const vincular_aluno_pacote = () => {
    normal_request('/backend/pacotes/listar', {}, 'GET', csrftoken)
      .then(response => {
        let html = `
          <div class="row">
            <div class="col-12 mb-3">
              <h2 class="text-center mb-3 mt-4">Escolha o Pacote desejado</h2>
              <div class="div_voltar">
                <button class="btn btn-new" id="btn-voltar-horarios">Voltar para os horários</button>
              </div>
            </div>
        `;

        response.dados.forEach((pacotes) => {
          html += construirCardPacotes(pacotes);
        });

        html += `</div>`;
        body.html(html);

        $(".btn-select-pacotes").click((event) => {
          const { value } = event.target;
          storedInfo.pacote = value;
        });

        $("#btn-voltar-horarios").click((event) => {
          carregar_horarios(storedInfo)
        });

      });
  };

  const carregar_horarios = (id) => {
    let html = `
      <h2 class="text-center mb-3 mt-4">Escolha o Horário desejado</h2>
      <div class="card custom-cards-agenda mt-4 mb-4 me-1 ms-1">
        <div class="row">
          <div class="col-12 mb-3">
            <div class="div_voltar">
              <button class="btn btn-new" id="btn-voltar-professores">Selecionar Professores</button>
            </div>
          </div>
    `;

    // Lógica para gerar os botões de horários
    html += `
          <div class="col-md-6 col-lg-4 col-sm-12 mb-3">
            <button class="btn btn-new btn-select-horario" type="button" value="00:00">00:00</button>
          </div>
    `;

    html += `</div></div>`;
    body.html(html);


    $(".btn-select-horario").click((event) => {
      const { value } = event.target;
      storedInfo.horario = value;
      vincular_aluno_pacote();
    });

    $("#btn-voltar-professores").click((event) => {
      carregar_professores(storedInfo);
    });
  };

  const carregar_professores = (info) => {
    normal_request('/backend/professores/listar', {}, 'GET', csrftoken)
      .then(response => {
        let html = `
          <div class="row">
            <div class="col-12 mb-3">
              <h2 class="text-center mb-3 mt-4">Escolha o professor</h2>
              <div class="div_voltar">
                <button class="btn btn-new" id="btn-voltar-agenda">Voltar para a Agenda</button>
              </div>
            </div>
        `;

        response.dados.forEach((professor) => {
          html += construirCardProfessor(professor);
        });

        html += `</div>`;
        body.html(html);

        $(".btn-select-professor").click((event) => {
          const { value } = event.target;
          storedInfo.professor = value;
          carregar_horarios(value);
        });

        $("#btn-voltar-agenda").click((event) => {
          location.reload();
        });

      });
  };

  calendar.render();
});
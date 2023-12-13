$(document).ready(function () {
  const csrftoken = getCSRFToken();
  const handleError = console.error;

  const modal = $("#modal-form");
  const alertavel = $("#alertavel");
  const divReserva = $("#divReserva");
  const divCalendario = $("#divCalendario");
  const formulario = $("#formulario_reserva");
  const divProfessores = $("#divProfessores");
  const professores_card = $("#card-professores");
  const divParticipantes = $("#participantesFieldset");
  const calendarEl = document.getElementById('calendar');
  calendarEl.style.width = '100%';

  const horarios = [
    { hora_ini: '06:00', hora_fim: '07:00' },
    { hora_ini: '07:00', hora_fim: '08:00' },
    { hora_ini: '08:00', hora_fim: '09:00' },
    { hora_ini: '09:00', hora_fim: '10:00' },
    { hora_ini: '10:00', hora_fim: '11:00' },
    { hora_ini: '11:00', hora_fim: '12:00' },
    { hora_ini: '14:00', hora_fim: '15:00' },
    { hora_ini: '15:00', hora_fim: '16:00' },
    { hora_ini: '16:00', hora_fim: '17:00' },
    { hora_ini: '17:00', hora_fim: '18:00' },
  ];

  const storedInfo = {};

  const card_professores = (professor) => {
    return `
      <div class="col-md-6 col-lg-4 col-sm-12 mb-3">
        <div class="card custom-cards-professores">
          <div class="card-body">
            <div class="div-foto mb-4">
              <img src="" class="img-professor"/>
            </div>
            <div class="div-nome mt-4">
              <h4>${professor.nome}</h4>
            </div>
            <div class="selecionavel mt-4 mb-4">
              <button class="btn btn-new btn-select-professor w-100" type="button" value="${professor.id}">Selecionar Professor</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const initializeSelect = (selector, placeholder, onChangeCallback) => {

    const $select = $(`#${selector}`).select2({
      minimumResultsForSearch: Infinity,
      placeholder: placeholder
    });

    if (onChangeCallback) {
      $select.change(function () {
        const selectedValue = $(this).val();
        storedInfo[selector] = selectedValue;
        onChangeCallback(selectedValue);
      });
    }

    return $select;
  };

  /**
   * Função de Inicialização do calendário
   * @returns FullCalendar
   */
  const initializeCalendar = () => {
    return new FullCalendar.Calendar(calendarEl, {

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
        const dataAtual = new Date();
        const dataClicada = new Date(info.date);

        console.log(info);

        dataAtual.setHours(0, 0, 0, 0);
        dataClicada.setHours(0, 0, 0, 0);

        if (dataClicada < dataAtual) {
          alertavel.find(".modal-body").text("Selecione uma data válida!");
          alertavel.modal("show");
        } else {
          storedInfo.data = info.dateStr;
          selecao_professores();
          modal.modal("show");
        }
      },
      dayMaxEventRows: true, // Adicione essa linha para limitar o número de eventos por linha
      eventTextColor: '#fff', // Defina a cor do texto do evento como branco
      contentHeight: 'auto', // Adicione essa linha para ajustar automaticamente a altura do calendário
      eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' }, // Adicione essa linha para formatar o horário do evento
      eventDisplay: 'block', // Adicione essa linha para exibir os eventos em blocos
      hiddenDays: [0],
      allDayText: 'Horário',
      slotDuration: '01:00',
      slotMinTime: '06:00',
      slotMaxTime: '18:00',
    });
  };

  const createOption = (value, text, selected = false, disabled = false) => {
    return $('<option>', { value, text, selected, disabled });
  };

  const carregar_pagantes = () => {
    showDiv(divReserva, [divCalendario, divProfessores]);

    const defaultOption = createOption('', 'Pagante', true, true);
    normal_request('/backend/alunos/listar', {}, 'GET', csrftoken)
      .then(json => {
        const options = json.dados
          .filter(val => val.ativo !== 'N')
          .map(val => createOption(val.id, val.nome));

        select_pagante.empty().append([defaultOption, ...options]);
      })
      .catch(handleError);
  };

  const carregar_pacotes = (idPagante) => {
    const defaultOption = createOption('', 'Pacotes', true, true);
    normal_request(`backend/alunos/${idPagante}/pacotes/buscar`, {}, 'GET', csrftoken)
      .then(json => {
        const options = json.dados
          .filter(val => val.ativo !== 'N')
          .map(val => createOption(val.pacote, val.pacote__nome));

        select_pacotes.empty().append([defaultOption, ...options]);
      })
      .catch(handleError);
  };

  const carregar_alunos = (select_alunos) => {
    const defaultOption = createOption('', 'Pacotes', true, true);
    normal_request('/backend/alunos/listar', {}, 'GET', csrftoken)
      .then(json => {
        let option;
        select_alunos.empty().append(defaultOption);

        json.dados.filter(val => val.ativo !== 'N').forEach(val => {
          option = createOption(val.id, val.nome);
          select_alunos.append(option);
        });
      });
  };

  const carregar_participantes = (idPacote) => {
    divParticipantes.empty();

    normal_request(`/backend/pacotes/ver/${idPacote}`, {}, 'GET', csrftoken)
      .then(response => {
        let html = '';

        storedInfo.qtd_participantes = response.dados.qtd_participantes;

        for (let i = 0; i < response.dados.qtd_participantes; i++) {
          html += `
            <fieldset class="mt-1 mb-2">
                <legend>Participante #${i + 1}</legend>
                <div id="divFieldset-${i}">
                  <div class="select_cadastro">
                    <select id="possui_cadastro_${i}" data-id="${i}" class="form-control possui_cadastro">
                        <option selected disabled>Possui cadastro ?</option>
                        <option value="S">Sim</option>
                        <option value="N">Não</option>
                    </select>
                  </div>
                </div>
            </fieldset>`;
        }

        let divHorarios = $('<div id="divHorarios"></div>');
        let horariosHtml = '';

        for (const horario of horarios) {
          horariosHtml += `
            <button class="btn btn-horario" data-hora_ini="${horario.hora_ini}" data-hora_fim="${horario.hora_fim}" type="button">${horario.hora_ini}</button>
          `;
        }

        divHorarios.append(horariosHtml);

        divParticipantes.empty().append([html, divHorarios]);
        divParticipantes.show();
      })
      .catch(handleError);
  };

  const calendar = initializeCalendar();
  const select_pagante = initializeSelect("pagante", "Pagante", carregar_pacotes);
  const select_pacotes = initializeSelect("pacotes", "Pacotes", carregar_participantes);

  const showDiv = (divToShow, divsToHide) => {
    divsToHide.forEach(div => div.hide());
    divToShow.show();
  };

  const selecao_professores = () => {
    professores_card.empty();
    showDiv(divProfessores, [divCalendario, divReserva]);
    normal_request('/backend/professores/listar', {}, 'GET', csrftoken)
      .then(response => {
        response.dados.forEach((professor) => {
          professores_card.append(card_professores(professor));
        });

        $(".btn-select-professor").click((event) => {
          carregar_pagantes();
        });

        $("#btn-voltar-agenda").click((event) => {
          showDiv(divCalendario, [divProfessores, divReserva]);
        });
      })
      .catch(handleError);
  };

  const selecao_participantes = () => {
    showDiv(divCalendario, [divReserva, divProfessores]);

    $("#btn-voltar-professores").click((event) => {
      showDiv(divProfessores, [divCalendario, divReserva]);
    });
  };

  divParticipantes.on("change", ".possui_cadastro", function () {
    let campos = '';
    const index = $(this).data("id");
    const fieldset = $(`#divFieldset-${index}`);

    fieldset.find(".campos-participante").remove();

    if ($(this).val() === 'S') {
      campos = `
        <div class="select_aluno mt-1" style="width:100%">
          <select id="nome_participante_${index}" nome="aluno-${index}" class="form-control alunos" style="width:100%">
            <option selected disable>Aluno</option>
          </select>
        </div>`;
    } else {
      campos = `
        <div class="input_aluno mt-1" style="width:100%">
          <input id="nome_participante_${index}" nome="nome_participante_${index}" data-id="${index}" class="form-control" type="text" placeholder="Nome"/>
        </div>`;
    }

    campos += `
      <div class="input_aluno mt-1 ms-1 mb-1" style="width:100%">
        <input id="celular_participante_${index}" nome="celular_participante_${index}" data-id="${index}" class="form-control celular" type="text" placeholder="Celular"/>
      </div>`;

    fieldset.append(`<div class="campos-participante">${campos}`);

    const select_alunos = $(`#nome_participante_${index}`).closest(".select_aluno").find(".alunos").select2({
      placeholder: "Aluno"
    });

    $(".celular").mask('(00) 0 0000-0000');

    carregar_alunos(select_alunos);
  });

  formulario.on("click", '#btn-reserva', function () {
    console.log("clicou");
    const participantesInfo = [];



    for (let i = 0; i < storedInfo.qtd_participantes; i++) {
      const nomeParticipante = $(`#nome_participante_${i}`).val();
      const celularParticipante = $(`#celular_participante_${i}`).val();

      participantesInfo.push({
        nome: nomeParticipante || '', // Evita que o valor seja undefined
        celular: celularParticipante || '' // Evita que o valor seja undefined
      });
    }

    storedInfo.participantes = participantesInfo;
    console.log(storedInfo);
  });


  divParticipantes.on("click", ".btn-horario", function () {
    let horaIni = $(this).data("hora_ini");
    let horaFim = $(this).data("hora_fim");

    storedInfo.horaIni = horaIni;
    storedInfo.horaFim = horaFim;

    $(".btn-horario").removeClass("active");
    $(this).addClass("active");

    console.log(storedInfo)
  });

  calendar.render();
  selecao_participantes();
});

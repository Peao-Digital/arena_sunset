$(document).ready(function () {
  const csrftoken = getCSRFToken();
  const handleError = console.error;

  const modal = $("#modal-form");
  const modalEvento = $("#eventoModal");
  const alertavel = $("#alertavel");

  const tiporeserva_card = $("#card-tipo-aula");
  const professores_card = $("#card-professores");

  const divCalendario = $("#divCalendario");
  const divTipoReserva = $("#divTipoReserva");
  const divProfessores = $("#divProfessores");
  const divReservaAvulsa = $("#divReservaAvulsa");
  const divReservaRegular = $("#divReservaRegular");

  const horarios_Avulsos = $("#horarios_avulsos");
  const horarios_regular = $("#horarios_regular");

  const calendarEl = document.getElementById('calendar');
  calendarEl.style.width = '100%';

  const storedInfo = {};

  $(".nr_pagantes").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Selecione o Número de Pagantes",
  }).change(function () {
    const value = $(this).val();
    const tipo = $(this).data('id');
    carregar_campos_selects(value, tipo);
    carregar_horarios(tipo);
  });

  /**
   * Função de carregamento dos cards de professores no fluxo de reservas
   * @param {*} professor 
   * @returns 
   */
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

  /**
   * Função de carregamento dos cards de tipos de aulas no fluxo de reservas
   * @param {*} tipo_aula 
   * @returns 
   */
  const card_aulas = (tipo_aula) => {
    return `
      <div class="col-md-6 col-lg-4 col-sm-12 mb-3">
        <div class="card custom-cards-professores">
          <div class="card-body">
            <div class="div-nome mt-4">
              <h4>${tipo_aula.nome}</h4>
            </div>
            <div class="div-texto row mt-4">
              <div class="col-lg-10 col-md-12 col-sm-12 ">
                <i class="fas fa-check icone-check"></i> <b>Cobrança: </b>
                <p class="ms-4">${tipo_aula.agendamento}</p>
                <i class="fas fa-check icone-check"></i> <b>Agendamento: </b>
                <p class="ms-4">${tipo_aula.recorrencia}</p>
              </div>
            </div>
            <div class="selecionavel mt-4 mb-4">
              <button class="btn btn-new btn-select-aula w-100" type="button" value="${tipo_aula.value}">Selecionar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  /** Função de inicialização de tela de Seleção de professores no fluxo de reservas */
  const selecao_professores = () => {
    professores_card.empty();

    showDiv(divProfessores, [divCalendario, divTipoReserva, divReservaAvulsa, divReservaRegular]);
    normal_request('/backend/professores/listar', {}, 'GET', csrftoken)
      .then(response => {
        response.dados.forEach((professor) => {
          professores_card.append(card_professores(professor));
        });

        $(".btn-select-professor").click((event) => {
          const { value } = event.target;
          storedInfo.professor = value;

          showDiv(divTipoReserva, [divCalendario, divProfessores, divReservaAvulsa, divReservaRegular]);
          selecao_tipo_aula();
        });
      })
      .catch(handleError);
  };

  /** Função de inicialização de tela de Seleção de tipos de aulas no fluxo de reservas */
  const selecao_tipo_aula = () => {
    tiporeserva_card.empty();

    const tipos = [{
      value: 'avulsa',
      nome: 'Aula Avulsa',
      agendamento: '- Cobrança única',
      recorrencia: '- Realizado apenas na data escolhida.'
    }, {
      value: 'regular',
      nome: 'Aula Regular',
      agendamento: '- Descontado do pacote',
      recorrencia: '- Realizado com base no pacote vinculado.'
    }];

    tipos.forEach((aulas) => {
      tiporeserva_card.append(card_aulas(aulas));
    });

    $(".btn-select-aula").click(function (event) {
      if ($(this).val() === 'avulsa') {
        showDiv(divReservaAvulsa, [divCalendario, divProfessores, divTipoReserva, divReservaRegular]);
      } else {
        showDiv(divReservaRegular, [divCalendario, divProfessores, divTipoReserva, divReservaAvulsa]);
      }
    });
  };

  /**
 * Função de carregamento dos pagantes
 * @param {*} $form Formulário jQuery onde os selects serão carregados
 */
  const carregar_pagantes = async ($form) => {
    try {
      const defaultOption = createOption('', 'Pagante', true, true);

      // Requisição assíncrona para obter a lista de alunos
      const response = await normal_request('/backend/alunos/listar', {}, 'GET', csrftoken);
      const dadosFiltrados = response.dados.filter(val => val.ativo !== 'N');

      // Atualiza cada select de pagante no formulário
      $form.find('.select-pagante').each(function () {
        const $select = $(this).empty().append(defaultOption.clone());

        // Adiciona cada aluno filtrado como uma opção do select
        dadosFiltrados.forEach(val => {
          $select.append(createOption(val.id, val.nome));
        });
      });
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Carrega e exibe pacotes disponíveis baseados no ID do aluno.
   * @param {string} id - ID do aluno.
   * @param {number} posicao - Posição do select no formulário.
   */
  const carregar_pacotes = (id, posicao) => {
    const defaultOption = createOption('', 'Pacotes', true, true);
    const selectPacotes = $(`.select-pacote-${posicao}`);

    // Requisição para obter pacotes do aluno
    normal_request(`/backend/alunos/${id}/pacotes/buscar`, {}, 'GET', csrftoken)
      .then(json => {
        const options = json.dados
          .filter(({ ativo }) => ativo !== 'N')
          .map(({ pacote__id, pacote__nome, pacote__qtd_participantes }) => ({
            valor: pacote__id,
            nome: pacote__nome,
            qtdParticipantes: pacote__qtd_participantes,
          }));

        // Limpa as opções anteriores e adiciona a opção padrão
        selectPacotes.empty();
        selectPacotes.append(defaultOption);

        // Adiciona as novas opções
        options.forEach(option => {
          const optionElement = createOption(option.valor, option.nome);
          optionElement.attr('data-qtd-participantes', option.qtdParticipantes);
          selectPacotes.append(optionElement);
        });

      })
      .catch(handleError); // Tratamento de erros
  };

  /**
 * Carrega a lista de alunos em um elemento de seleção (dropdown).
 * @param {jQuery} selectElement O elemento de seleção (dropdown) jQuery.
 */
  const carregar_alunos = async (selectElement) => {
    try {
      // Inicializa o select2 no elemento de seleção
      selectElement.select2({
        minimumResultsForSearch: Infinity,
        placeholder: "Selecione o Participante",
      });

      // Opção padrão para o select
      const defaultOption = createOption('', 'Selecione o Participante', true, true);
      selectElement.empty().append(defaultOption);

      // Requisição para buscar alunos ativos
      const response = await normal_request('/backend/alunos/listar', {}, 'GET', csrftoken);
      const { dados } = response;

      // Verifica se os dados recebidos são válidos
      if (!dados || !Array.isArray(dados)) {
        throw new Error("Dados inválidos recebidos do servidor");
      }

      // Filtra e adiciona alunos ativos ao select
      dados.filter(({ ativo }) => ativo !== 'N').forEach(({ id, nome }) => {
        const option = createOption(id, nome);
        selectElement.append(option);
      });
    } catch (error) {
      // Manipulação de erros
      handleError(error);
    }
  };

  /**
   * Função de carregamento dos horários das aulas
   * @param {*} tipo 
   */
  const carregar_horarios = (tipo) => {
    const horarios = [
      { horario_inicial: '06:00', horario_final: '07:00' },
      { horario_inicial: '07:00', horario_final: '08:00' },
      { horario_inicial: '08:00', horario_final: '09:00' },
      { horario_inicial: '09:00', horario_final: '10:00' },
      { horario_inicial: '10:00', horario_final: '11:00' },
      { horario_inicial: '11:00', horario_final: '12:00' },
      { horario_inicial: '14:00', horario_final: '15:00' },
      { horario_inicial: '15:00', horario_final: '16:00' },
      { horario_inicial: '16:00', horario_final: '17:00' },
      { horario_inicial: '17:00', horario_final: '18:00' },
    ];

    let BtnHorarios = "";

    for (const horario of horarios) {
      BtnHorarios += `
        <button class="btn btn-horario" data-hora_ini="${horario.horario_inicial}" data-hora_fim="${horario.horario_final}" type="button">${horario.horario_inicial}</button>
      `;
    }

    if (tipo === 'avulsa') {
      horarios_Avulsos.empty().append(BtnHorarios);
    } else {
      horarios_regular.empty().append(BtnHorarios);
    }

    $(".btn-horario").click(function () {
      // Remova a classe "disabled" de todos os botões de horário
      $(".btn-horario").removeClass("disabled");

      // Adicione a classe "disabled" apenas ao botão de horário clicado
      $(this).addClass("disabled");

      // Salve as horas iniciais e finais no storedInfo
      storedInfo.hora_ini = $(this).data("hora_ini");
      storedInfo.hora_fim = $(this).data("hora_fim");
    });
  }

  /**
   * Função de carregamento dos campos de pagantes/quantidades/pacotes
   * @param {*} numero_pagantes Número total de contratantes
   * @param {*} tipo Tipo de reserva (regular ou avulsa)
   */
  const carregar_campos_selects = (numero_pagantes, tipo) => {
    const $form = tipo === "avulsa" ? $('#campos_avulsos') : $('#campos_regular');
    $form.empty();

    for (let i = 0; i < numero_pagantes; i++) {

      const $divRow = $(`<div class="row selects-${i}"></div>`);

      const $divPagante = $(
        `<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
          <label class="form-label mb-2 mt-2">Pagante #${i + 1}</label>
        </div>
      `);

      const $paganteSelect = $('<select style="width:100%;">')
        .addClass('form-control select-pagante')
        .attr('id', `select-pagante-${i}`)
        .attr('name', 'pagante')
        .attr('data-id', i);

      $divPagante.append($paganteSelect);

      if (tipo === "avulsa") {
        const $divQuantidade = $(`<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12"><label class="form-label mb-2 mt-2">Total Participantes - Pagante #${i + 1}</label></div>`);
        const $quantidadeSelect = $('<select style="width:100%;">')
          .addClass('form-control quantidade-participantes')
          .attr('id', `quantidade-participantes-${i}`)
          .attr('name', 'quantidade-participantes')
          .attr('data-id', i);

        $quantidadeSelect.append('<option value="" disabled selected>Selecione a quantidade de participantes</option>');

        for (let j = 1; j <= 4; j++) {
          $quantidadeSelect.append(`<option value="${j}">${j}</option>`);
        }

        $divQuantidade.append($quantidadeSelect);
        $divRow.append($divPagante);
        $divRow.append($divQuantidade);
      } else {
        const $divPacote = $(`<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12"><label class="form-label mb-2 mt-2">Pacote - Pagante ${i + 1}</label></div>`);
        const $pacoteSelect = $('<select style="width:100%;">')
          .addClass(`form-control select-pacotes select-pacote-${i}`)
          .attr('id', `select-pacotes-${i}`)
          .attr('name', 'pacote')
          .attr('data-id', i);
        $divPacote.append($pacoteSelect);
        $divRow.append($divPagante);
        $divRow.append($divPacote);
      }

      $divRow.appendTo($form);
    }

    for (let i = 0; i < numero_pagantes; i++) {
      const $fieldset = $(`
        <fieldset class="mt-1 mb-2" id="fieldset-${i}">
          <legend>Pagante #${i + 1}</legend>
          <div id="divFieldsetPagante-${i}" class="row"></div>
        </fieldset>`
      );

      $form.append($fieldset);
    }

    $('.select-pagante').select2({
      minimumResultsForSearch: Infinity,
      placeholder: `Selecione o Pagante`,
    }).change(function () {
      const selectedPagante = $(this).val();
      const selectedPaganteNome = $(this).find('option:selected').text();
      const paganteIndex = $(this).data('id');

      if (tipo === 'regular') {
        carregar_pacotes(selectedPagante, paganteIndex);
      }

      $(`#fieldset-${paganteIndex} legend`).text(selectedPaganteNome);
    });

    $(`.quantidade-participantes`).select2({
      minimumResultsForSearch: Infinity,
      placeholder: "Selecione a Quantidade de Participantes",
    }).change(function () {
      const numeroParticipantes = $(this).val();
      const paganteIndex = $(this).data('id');
      renderizarFieldsets(numeroParticipantes, paganteIndex);
    });

    $(`.select-pacotes`).select2({
      minimumResultsForSearch: Infinity,
      placeholder: "Selecione o Pacote",
    }).change(function () {
      const qtdParticipantes = $(this).find('option:selected').data('qtd-participantes');
      const paganteIndex = $(this).data('id');

      renderizarFieldsets(qtdParticipantes, paganteIndex);
    });

    carregar_pagantes($form);
  };

  /**
   * Função que retorna os fieldsets de participantes de cada pagante
   * @param {*} qtdParticipantes Total de participantes dos pagantes
   * @param {*} paganteIndex Index do pagante que os dados se referem
   */
  const renderizarFieldsets = (qtdParticipantes, paganteIndex) => {
    const divFieldset = $(`#divFieldsetPagante-${paganteIndex}`);
    divFieldset.empty();
    for (let i = 0; i < qtdParticipantes; i++) {

      const participanteHtml = `<div class="col-lg-9 col-md-9 col-sm-12 row" id="dados_${paganteIndex}_${i}"></div>`;

      const selectHtml = `
        <div class="col-lg-3 col-md-3 col-sm-12 mb-2">
          <select id="possui_cadastro_${paganteIndex}_${i}" class="form-control possui_cadastro" data-pagante="${paganteIndex}" data-participante="${i}">
            <option selected disabled>Possui cadastro?</option>
            <option value="S">Sim</option>
            <option value="N">Não</option>
          </select>
        </div>`;

      divFieldset.append(selectHtml).append(participanteHtml);
    }

    $(".possui_cadastro").select2({
      minimumResultsForSearch: Infinity,
      placeholder: "Possui Cadastro ?",
    }).change(function () {
      const paganteIndex = $(this).data('pagante');
      const participanteIndex = $(this).data('participante');
      carregar_dados_participantes($(this).val(), paganteIndex, participanteIndex);
    });
  };

  /**
   * Função de carregamento dos selects e inputs de participantes, dentro dos fieldsets
   * @param {*} status Status se possui ou não cadastro
   * @param {*} paganteIndex Index do pagante que os dados se referem
   * @param {*} participanteIndex Index do participante que os dados se referem
   */
  const carregar_dados_participantes = (status, paganteIndex, participanteIndex) => {
    const divFieldsetDados = $(`#dados_${paganteIndex}_${participanteIndex}`);
    divFieldsetDados.empty();

    if (status === 'S') {

      const selectParticipante = $(`
        <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
          <select class="form-control nome_participantes participante-${paganteIndex}" id="participante_${paganteIndex}_${participanteIndex}" style="width:100%;">
            <option selected disabled>Selecione o Participante</option>
          </select>
        </div>`);

      const inputCelular = $(`
        <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
          <input type="text" class="form-control celular_aluno_${paganteIndex}_${participanteIndex}" placeholder="Celular" id="celular_aluno_${paganteIndex}_${participanteIndex}">
        </div>`);

      inputCelular.find('input').mask('(00) 0 0000-0000');

      divFieldsetDados.append(selectParticipante, inputCelular);
      carregar_alunos($(`#participante_${paganteIndex}_${participanteIndex}`));
    } else {
      const inputNome = $(`
      <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
        <input type="text" class="form-control" placeholder="Nome do Participante">
      </div`);

      const inputCelular = $(`
        <div class="col-lg-6 col-md-6 col-sm-12 mb-2" >
          <input type="text" class="form-control celular_participante_${paganteIndex}_${participanteIndex}" placeholder="Celular" id="celular_participante_${paganteIndex}_${participanteIndex}">
        </div>`);

      inputCelular.find('input').mask('(00) 0 0000-0000');

      divFieldsetDados.append(inputNome).append(inputCelular);
    }

    console.log('entrou aqui');
  };

  /** Função de busca de todas as reservas por período */
  const buscarReservas = async (dataInicial, dataFinal) => {
    const url = `/backend/agenda/buscar?data_inicial=${dataInicial}&data_final=${dataFinal}`;

    try {
      const response = await normal_request(url, {}, 'GET', csrftoken);
      return response.dados.map(reserva => formatarReserva(reserva));
    } catch (error) {
      handleError(error);
    }
  };

  /** Função para formatar a reserva */
  const formatarReserva = (reserva) => {
    const formattedStartTime = formatTime(reserva.horario_ini);
    const formattedEndTime = formatTime(reserva.horario_fim);
    const tipoCor = reserva.tipo === 'UNICA' ? '#0073e6' : '#FF5722';

    return {
      id: reserva.id,
      groupId: reserva.tipo,
      textColor: '#fff',
      backgroundColor: tipoCor,
      borderColor: tipoCor,
      end: new Date(`${reserva.data}T${formattedEndTime}`),
      title: reserva.professor.nome,
      start: new Date(`${reserva.data}T${formattedStartTime}`),
      allDay: false,
    };
  };

  /**
   * Função de busca de todas as reservas por id e tipo
   * @param {*} id Id da reserva
   * @param {*} tipo Tipo da reserva (unica ou avulsa) e (normal ou regular)
   */
  const buscar_reserva_individual = (id, tipo) => {
    const url = `/backend/agenda/reserva_${tipo === 'UNICA' ? 'unica' : 'normal'}/ver/${id}`;
    const fieldsetContratantes = $("#divDetalhesContratantes");
    const detalhesAula = $("#detalhesAula");

    normal_request(url, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;

        detalhesAula.empty();
        fieldsetContratantes.empty();

        const aulaInfo = `
          <div class="row mb-2">
            <div class="col-lg-12 col-md-12 col-sm-12"><strong>Professor:</strong> ${dados.professor.nome}</div>
          </div>
          <div class="row mb-2">
            <div class="col-lg-6 col-md-6 col-sm-12"><strong>Horário Inicial:</strong> ${dados.horario_inicial}</div>
            <div class="col-lg-6 col-md-6 col-sm-12"><strong>Horário Final:</strong> ${dados.horario_final}</div>
          </div>          
        `;

        detalhesAula.html(aulaInfo);
        const groupedAlunos = agruparAlunosPorContratante(dados.alunos);

        Object.values(groupedAlunos).forEach((group, index) => {
          const contratanteContainer = $(`<div class="contratante-container"></div>`);
          contratanteContainer.append(`<b>Contratante #${index + 1}</b> - <span>${group.nomeContratante}</span`);

          const participantsFieldset = $(`<fieldset class="mt-1 mb-2 divDetalhesParticipantes"><legend>Participantes</legend></fieldset>`);

          if (group.participantes) {
            group.participantes.forEach(participantName => {
              participantsFieldset.append(`<b>${participantName}</b>`);
            });
          }

          contratanteContainer.append(participantsFieldset);
          fieldsetContratantes.append(contratanteContainer);
        });

        // Definir o ouvinte de evento para o botão "Cancelar Aula" dentro do modalEvento
        modalEvento.find('.modal-footer').html(`<button class="btn confirm-delete confirm-cancel">Cancelar Aula</button>`);
        modalEvento.modal('show');

        $(".confirm-cancel").click(() => {
          alertavel.find('.modal-body').empty();
          alertavel.find('.modal-footer').empty();

          alertavel.find('.modal-body').html("Tem certeza que deseja cancelar a aula ?");
          alertavel.find('.modal-footer').html(`<button class="btn confirm-delete cancelar-aula" value="${id}" data-tipo="${tipo}">Cancelar</button>`);
          alertavel.modal("show");
          modalEvento.modal("hide");
        });
      })
      .catch(handleError);
  };

  const cancelar_aula = (id, tipo) => {
    const url_cancelar = `/backend/agenda/reserva_${tipo === 'UNICA' ? 'unica' : 'normal'}/cancelar/${id}`;

    normal_request(url_cancelar, {}, 'PUT', csrftoken)
      .then(response => {
        const successMessage = response.msg || ''

        if (successMessage.includes("Reserva cancelada!")) {
          console.log("a");
          alertavel.find('.modal-body').html(`O registro foi cancelado com sucesso!`);
          alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
          location.reload();
        } else {
          alertavel.find('.modal-body').html('Não foi possível cancelar a aula', response.msg);
          alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
        }
      })
      .catch(handleError);
  }

  /**
   * Organiza uma lista de alunos em grupos baseados no contratante a que cada participante está associado
   * @param {array} alunos 
   * @returns 
   */
  const agruparAlunosPorContratante = (alunos) => {
    return alunos.reduce((acumulador, {
      contratante_id: idContratante,
      contratante_nome: nomeContratante,
      nome: nomeAluno
    }) => {
      if (!acumulador[idContratante]) {
        acumulador[idContratante] = {
          nomeContratante,
          participantes: []
        };
      }
      acumulador[idContratante].participantes.push(nomeAluno);
      return acumulador;
    }, {});
  }

  // Função para reservar aula regular
  const reservar_aula_regular = () => {
    const contratantes = [];

    const total_pagantes = $(".nr_pagantes.regular").val(); // Obtém o total de pagantes

    // Inicializa variáveis de controle para verificação dos campos preenchidos
    let camposPreenchidos = {
      pagantes: true,
      pacotes: true,
      participantes: true
    };

    // Itera sobre cada pagante
    for (let i = 0; i < total_pagantes; i++) {
      const pagante = $(`#select-pagante-${i}`).val();
      const pacote = $(`#select-pacotes-${i}`).val();
      const qtdParticipantes = parseInt($(`#select-pacotes-${i} option:selected`).data('qtd-participantes'));
      const alunos = [];
      const participantes = [];

      // Verifica se pagante ou pacote não estão preenchidos
      if (!pagante) {
        camposPreenchidos.pagantes = false;
        break;
      }
      if (!pacote) {
        camposPreenchidos.pacotes = false;
        break;
      }

      // Itera sobre cada participante dentro de um pacote
      for (let j = 0; j < qtdParticipantes; j++) {
        const possuiCadastro = $(`#possui_cadastro_${i}_${j}`).val();

        if (possuiCadastro === 'S') {
          const alunoId = $(`#participante_${i}_${j}`).val();
          alunos.push(alunoId);

          // Verifica se participante está preenchido
          if (!alunoId) {
            camposPreenchidos.participantes = false;
            break;
          }
        } else {
          const nomeParticipante = $(`#dados_${i}_${j} input[type='text']:first`).val();
          const celularParticipante = $(`#dados_${i}_${j} input[type='text']:last`).val().replaceAll('(', '').replaceAll(')', '').replaceAll('-', '').replaceAll(' ', '');

          // Verifica se nome e celular do participante estão preenchidos
          if (!nomeParticipante || !celularParticipante) {
            camposPreenchidos.participantes = false;
            break;
          }

          participantes.push([nomeParticipante, celularParticipante]);
        }
      }

      contratantes.push({ contratante: pagante, pacote: pacote, alunos, participantes });
    }

    // Verifica se todos os campos necessários foram preenchidos
    if (Object.values(camposPreenchidos).includes(false) || !total_pagantes) {
      alertavel.find(".modal-body").text("Selecione todos os campos antes de fazer a reserva.");
      alertavel.modal("show");
      return;
    }

    if (!storedInfo.hora_ini || !storedInfo.hora_fim) {
      alertavel.find(".modal-body").text("É necessário informar um horário para a reserva.");
      alertavel.modal("show");
      return;
    }

    gravar_reserva(contratantes, 'regular', storedInfo);
  };

  // Função para reservar aula avulsa
  const reservar_aula_avulsa = () => {
    const contratantes = [];

    const total_pagantes = $(".nr_pagantes.avulsa").val();

    let camposPreenchidos = {
      pagantes: true,
      qtd: true,
      participantes: true
    };

    for (let i = 0; i < total_pagantes; i++) {
      const pagante = $(`#select-pagante-${i}`).val();
      const qtdParticipantes = $(`#quantidade-participantes-${i}`).val();

      const alunos = [];
      const participantes = [];

      if (!qtdParticipantes) {
        camposPreenchidos.pagantes = false;
        break;
      }

      for (let j = 0; j < qtdParticipantes; j++) {
        const possuiCadastro = $(`#possui_cadastro_${i}_${j}`).val();

        if (possuiCadastro === 'S') {
          const alunoId = $(`#participante_${i}_${j}`).val();
          alunos.push(alunoId);

          if (!alunoId) {
            camposPreenchidos.participantes = false;
            break;
          }

        } else {
          const nomeParticipante = $(`#dados_${i}_${j} input[type='text']:first`).val();
          const celularParticipante = $(`#dados_${i}_${j} input[type='text']:last`).val().replaceAll('(', '').replaceAll(')', '').replaceAll('-', '').replaceAll(' ', '');

          if (!nomeParticipante || !celularParticipante) {
            camposPreenchidos.participantes = false;
            break;
          }

          participantes.push([nomeParticipante, celularParticipante]);

        }
      }

      contratantes.push({ contratante: pagante, pacote: null, alunos, participantes });
    }

    if (Object.values(camposPreenchidos).includes(false) || !total_pagantes) {
      alertavel.find(".modal-body").text("Selecione todos os campos antes de fazer a reserva.");
      alertavel.modal("show");
      return;
    }

    if (!storedInfo.hora_ini || !storedInfo.hora_fim) {
      alertavel.find(".modal-body").text("É necessário informar um horário para a reserva.");
      alertavel.modal("show");
      return;
    }

    gravar_reserva(contratantes, 'avulsa', storedInfo);
  };

  /**
   * Função para gravar dados da reserva
   * @param {*} contratantes Pagantes do projeto, e participantes
   * @param {*} tipo Tipo da reserva (unica ou avulsa) e (normal ou regular)
   * @param {*} storedInfo Data, hora, professor
   */
  const gravar_reserva = (contratantes, tipo, storedInfo) => {
    const data = new Date(storedInfo.data);
    let data_formatada;
    let url;

    if (tipo === 'avulsa') {
      const ano = data.getFullYear();
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const dia = data.getDate().toString().padStart(2, '0');
      data_formatada = `${ano}-${mes}-${dia}`;

      url = '/backend/agenda/reserva_unica/criar';
    } else {
      data_formatada = data.getDay() - 1;
      url = '/backend/agenda/reserva_normal/criar';
    }

    const payload = {
      'professor': storedInfo.professor,
      'hora_ini': storedInfo.hora_ini,
      'hora_fim': storedInfo.hora_fim,
      'contratantes': contratantes,
    };

    payload[tipo === 'avulsa' ? 'data' : 'dia_semana'] = data_formatada;

    normal_request(url, payload, 'POST', csrftoken)
      .then(response => {
        if (!response.erro) {
          alertavel.find(".modal-body").text("Dados Gravados com Sucesso!");
          alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
          alertavel.modal("show");
          alertavel.on('hidden.bs.modal', function (e) {
            location.reload();
          });
        } else {
          alertavel.find(".modal-body").text(response.erro);
          alertavel.modal("show");
        }
      })
      .catch(handleError);
  };

  /**
   * Função de Inicialização do calendário
   * @returns FullCalendar
   */
  const initializeCalendar = () => {
    let calendar = new FullCalendar.Calendar(calendarEl, {
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

        dataAtual.setHours(0, 0, 0, 0);
        dataClicada.setHours(0, 0, 0, 0);

        if (dataClicada < dataAtual) {
          alertavel.find(".modal-body").text("Selecione uma data válida!");
          alertavel.modal("show");
        } else {
          storedInfo.data = info.date;
          selecao_professores();
          modal.modal("show");
        }
      },
      eventClick: function (info) {
        buscar_reserva_individual(info.event.id, info.event.groupId);
      },
      dayMaxEventRows: true, // Adicione essa linha para limitar o número de eventos por linha
      eventTextColor: '#fff', // Defina a cor do texto do evento como branco
      contentHeight: 'auto', // Adicione essa linha para ajustar automaticamente a altura do calendário
      eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' }, // Adicione essa linha para formatar o horário do evento
      eventDisplay: 'block', // Adicione essa linha para exibir os eventos em blocos
      hiddenDays: [0],
      allDayText: 'Dia Todo',
      slotDuration: '01:00',
      slotMinTime: '06:00',
      slotMaxTime: '18:00',
    });

    calendar.render();

    const { activeStart, activeEnd } = calendar.view;
    const dataInicial = activeStart.toISOString().split('T')[0];
    const dataFinal = activeEnd.toISOString().split('T')[0];

    buscarReservas(dataInicial, dataFinal).then(dados => calendar.addEventSource(dados));
  };

  showDiv(divCalendario, [divProfessores, divTipoReserva, divReservaAvulsa, divReservaRegular]);

  $(".btn-voltar").click((event) => {
    showDiv(divCalendario, [divProfessores, divTipoReserva, divReservaAvulsa, divReservaRegular]);
  });

  $("#gravar_reserva_avulsa").click(() => {
    reservar_aula_avulsa();
  });

  $("#gravar_reserva_regular").click(() => {
    reservar_aula_regular();
  });

  $(document).on('click', '.cancelar-aula', function () {
    const id = $(this).val();
    const tipo = $(this).data('tipo');
    cancelar_aula(id, tipo);
  });

  initializeCalendar();
});
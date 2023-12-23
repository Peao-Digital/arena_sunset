$(document).ready(() => {
  const csrftoken = getCSRFToken();

  const dataTablePT_BR = "/static/frontend/js/libs/dataTables.portuguese.json";
  const alertError = $("#error-message");
  const alertavel = $("#alertavel");
  const modal = $("#modal-form");
  const modal_view = $("#modal-view");
  const modal_plans = $("#modal-plans");

  const input_cpf = $('#cpf');
  const input_nome = $("#nome");
  const input_sexo = $("#sexo");
  const input_email = $("#email");
  const input_celular = $("#celular");
  const input_nascimento = $("#data_nasc");

  const select_sexo = $("#sexo").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Selecione o Sexo",
  });

  const select_pacotes = $("#pacotes").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Selecione o Pacote",
  }).change(function () {
    btnGravarVinculo.val($(this).val());
  });

  const datatable = $("#datatable-aluno").DataTable({
    searching: true,
    language: {
      url: dataTablePT_BR,
    },
  });

  input_cpf.mask('000.000.000-00');
  input_celular.mask('(00) 0 0000-0000');

  /** Função de validação dos dados.*/
  const handleError = (error) => {
    console.error(error);
  };

  /** Função de carregamento dos pacotes e select de pacotes.*/
  const carregar_pacotes = () => {
    const defaultOption = $('<option>', {
      value: '',
      text: 'Pacotes',
      selected: true,
      disabled: true,
    });

    normal_request('/backend/pacotes/listar', {}, 'GET', csrftoken)
      .then(json => {
        let option;
        select_pacotes.empty().append(defaultOption);

        json.dados.filter(val => val.ativo !== 'N').forEach(val => {
          option = $("<option>").val(val.id).text(val.nome);
          select_pacotes.append(option);
        });
      })
      .catch(handleError);
  };

  /* Função para carregar os dados e preencher a tabela datatable */
  const carregar_dados = () => {

    normal_request('/backend/alunos/listar', {}, 'GET', csrftoken)
      .then(json => {
        datatable.clear(); // Limpa a tabela

        json.dados.forEach(data => {

          const acoes = `
          <button type="button" class="btn btn-view" data-id="${data.id}" title="Ver Dados"><i class="fas fa-eye"></i></button>
          <button type="button" class="btn btn-edit" data-id="${data.id}" title="Editar"><i class="fas fa-edit"></i></button>
          <button type="button" class="btn btn-delete" data-id="${data.id}" title="Deletar"><i class="fas fa-trash"></i></button>
          <button type="button" class="btn btn-plans" data-id="${data.id}" data-nome="${data.nome}" title="Ver Pacotes"><i class="fa-solid fa-gift"></i></button>`;

          const status = data.ativo === 'S' ? `<button class="btn btn-ativo" data-id="${data.id}" title="Mudar status para Inativo">Ativo</button>` : `<button class="btn btn-inativo" data-id="${data.id}" title="Mudar status para Ativo">Inativo</button>`;

          let celular;
          let cpf;

          if (data.cpf) {
            cpf = data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          }

          if (data.celular) {
            celular = data.celular.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
          }

          datatable.row.add([
            data.nome,
            cpf || 'CPF não informado',
            data.email || 'Email não informado',
            celular || 'Celular não informado',
            status,
            acoes
          ]);
        });

        // Desenha a tabela
        datatable.draw();

        // Adiciona eventos de clique aos botões
        $('.btn-edit').click(function () {
          const alunoId = $(this).data('id');
          openEditModal(alunoId);
        });

        $('.btn-view').click(function () {
          const alunoId = $(this).data('id');
          openViewModal(alunoId);
        });

        $('.btn-plans').click(function () {
          const alunoId = $(this).data('id');
          const alunoNome = $(this).data('nome');
          openPlansModal(alunoId, alunoNome);
        });
      })
      .catch(handleError);
  };

  /**
   * Abre o modal de pacotes com base no ID do usuário.
   * @param {number} alunoId - O ID do usuário.
   * @param {string} alunoNome - O nome do usuário.
   */
  const openPlansModal = (alunoId, alunoNome) => {
    modal_plans.find('.modal-title').text(`Vínculo de Pacotes do usuário #${alunoId}`);

    carregar_pacotes();

    $("#aluno_nome").attr('data-id', alunoId).val(alunoNome);

    let pacoteId = $("#pacote").val();
    btnGravarVinculo.val(pacoteId);

    modal_plans.modal("show");
  };

  /**
 * Abre o modal de visualização dos dados do aluno.
 * @param {number} alunoId - O ID do aluno a ser visualizado.
 */
  const openViewModal = (alunoId) => {
    modal_view.find('.modal-title').text(`Dados do Aluno #${alunoId}`);

    $('#current-plan').empty();
    $('#history').empty();

    // Função para criar campos de visualização
    const createField = (label, value, classes) => `
    <div class="labels-view ${classes}">
      <label><b>${label}:</b> ${value}</label>
    </div>`;

    // Requisição para obter os dados do aluno
    normal_request(`/backend/alunos/ver/${alunoId}`, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;

        const userData = `
        ${createField('Nome', dados.nome, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('CPF', dados.cpf, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Sexo', dados.sexo, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Celular', dados.celular, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Email', dados.email, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Data de nascimento', converter_data(dados.nascimento), "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
      `;

        $('#user-data').html(userData);
        modal_view.modal("show");
      })
      .catch(handleError);

    // Requisição para obter os pacotes do aluno
    normal_request(`/backend/alunos/${alunoId}/pacotes/buscar`, {}, 'GET', csrftoken)
      .then(response => {
        const ativos = response.dados;
        const historico = response.historico;

        const activePlans = ativos.filter(pacote => pacote.ativo === 'S');
        const historyPlans = historico.filter(pacote => pacote.desativado_em !== null);

        // Mapeia os pacotes ativos para o formato HTML
        const activePlansHTML = activePlans.map(pacote => {
          const dataValidade = new Date(pacote.data_validade);
          const hoje = new Date();
          const diferencaEmDias = (dataValidade - hoje) / (1000 * 3600 * 24);

          let botaoRenovar = '';
          if (diferencaEmDias <= 7 && diferencaEmDias >= -14) {
            botaoRenovar = `<button class="btn btn-new renovar_pacote" type="button" data-id="${pacote.pacote__id}">Renovar</button>`;
          }

          return `
            ${createField('Pacote', pacote.pacote__nome, "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
            ${createField('Contratação', converter_data(pacote.data_contratacao), "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
            ${createField('Validade', converter_data(pacote.data_validade), "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
          `;
        }).join('');

        const historyPlansHTML = historyPlans.map(pacote => `
          ${createField('Nome', pacote.aluno_pacote__pacote__nome, "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
          ${createField('Data Contratação', converter_data(pacote.data_contratacao), "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
          ${createField('Finalizado em', converter_data(pacote.desativado_em), "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
        `).join('');

        displaySection('#current-plan', activePlansHTML, 'Sem Pacotes Vinculados');
        displaySection('#history', historyPlansHTML, 'Sem Pacotes Anteriores');
      })
      .catch(handleError);
  };

  /**
   * Exibe a seção especificada com os dados fornecidos ou uma mensagem padrão.
   * @param {string} sectionId - O ID da seção a ser atualizada.
   * @param {string} content - O conteúdo a ser exibido na seção.
   * @param {string} defaultMessage - A mensagem padrão a ser exibida se o conteúdo estiver vazio.
   */
  const displaySection = (sectionId, content, defaultMessage) => {
    if (content.length > 0) {
      $(sectionId).html(content);
    } else {
      $(sectionId).html(`<div class="col-12 text-center">${defaultMessage}</div>`);
    }
  };

  /**
  * Puxa os dados do usuário através da ID existente no backend para edição.
  * @param {number} alunoId - O ID do usuário a ser editado.
  */
  const openEditModal = (alunoId) => {
    modal.find('.modal-title').text(`Editando Aluno #${alunoId}`);
    $('#error-message').text('').hide();

    normal_request(`/backend/alunos/ver/${alunoId}`, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;
        input_email.val(dados.email);
        input_nome.val(dados.nome);
        input_cpf.val(dados.cpf).unmask();
        input_celular.val(dados.celular).unmask();
        btnGravar.val(dados.id);
        modal.modal("show");

        input_cpf.mask('000.000.000-00');
        input_celular.mask('(00) 0 0000-0000');
      })
      .catch(handleError);
  };

  /**
  * Abre o modal de remoção do aluno através da ID existente no backend.
  * @param {number} planId - O ID do aluno a ser deletado.
  */
  const openDeleteModal = (planId) => {
    alertavel.find('.modal-body').empty();
    alertavel.find('.modal-footer').empty();

    alertavel.find('.modal-body').html("Tem certeza que deseja deletar o aluno ?");
    alertavel.find('.modal-footer').html(`<button class="btn confirm-delete">Deletar</button>`);
    alertavel.modal("show");

    $(".confirm-delete").off("click").click(() => {
      normal_request(`/backend/alunos/deletar/${planId}`, {}, 'DELETE', csrftoken)
        .then(response => {
          const successMessage = response.msg || ''

          if (successMessage.includes('O registro foi deletado com sucesso!')) {
            alertavel.find('.modal-body').html(`O registro foi deletado com sucesso!`);
            alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
            carregar_dados();
          } else {
            alertavel.find('.modal-body').html('Não foi possível remover o cadastro do aluno', response.msg);
            alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
          }
        })
        .catch(handleError);
    });
  };

  /**
  * Abre o modal de remoção do aluno através da ID existente no backend.
  * @param {number} planId - O ID do aluno a ser deletado.
  */
  const openCancelModal = (planId) => {
    alertavel.find('.modal-body').empty();
    alertavel.find('.modal-footer').empty();


    alertavel.find('.modal-body').html("Tem certeza que deseja cancelar o contrato ?");
    alertavel.find('.modal-footer').html(`<button class="btn confirm-disabled">Cancelar</button>`);
    alertavel.modal("show");
    modal_view.modal('hide');

    $(".confirm-disabled").off("click").click(() => {
      normal_request(`/backend/pacotes/cancelar_contrato/${planId}`, {}, 'put', csrftoken)
        .then(response => {
          const successMessage = response.msg || ''

          if (successMessage.includes('Contrato cancelado com sucesso!')) {
            alertavel.find('.modal-body').html(`Contrato cancelado com sucesso!`);
            alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
            carregar_dados();
          } else {
            console.error('Erro ao cancelar contrato:', response.msg);
          }
        })
        .catch(handleError);
    });
  };

  /**
  * Valida o formulário antes de Gravar os dados do Alunos.
  * @param {Array} formsData - Um array contendo os elementos do formulário.
  */
  const validateForm = (formsData, tipo) => {
    if (formsData.some(form => !form || form.val().trim() === '')) {
      alertError.text('Todos os campos devem ser preenchidos.').show();
      return false;
    }

    return true;
  };

  /**
   * Grava os dados do novo aluno no backend.
   */
  const gravarFormAluno = () => {
    const formsData = [input_nome];

    if (validateForm(formsData)) {
      normal_request('/backend/alunos/criar', {
        celular: input_celular.val().replaceAll('(', '').replaceAll(')', '').replaceAll('-', '').replaceAll(' ', ''),
        cpf: input_cpf.val().replaceAll('.', '').replaceAll('-', ''),
        nome: input_nome.val(),
        email: input_email.val(),
        sexo: input_sexo.val(),
        nascimento: input_nascimento.val(),
        ativo: 'S'
      }, 'POST', csrftoken)
        .then(response => {
          if (!response.erro) {
            alertavel.find(".modal-body").text("Dados Gravados com Sucesso!");
            alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
            alertavel.modal("show");
            carregar_dados();
            modal.modal("hide");
          } else {
            alertavel.find(".modal-body").text(response.erro);
            alertavel.modal("show");
          }
        })
        .catch(handleError);
    }
  };

  /**
   * Grava o vinculo entre aluno e pacote no backend.
   */
  const gravarPacoteAluno = (pacoteId) => {
    const aluno = $("#aluno_nome");
    const data_contratacao = $("#contratacao");
    const pacote = $("#pacotes");
    const formsData = [aluno, data_contratacao, pacote];

    if (validateForm(formsData)) {
      normal_request(`/backend/pacotes/${pacoteId}/contratar`, {
        aluno: aluno.data('id'),
        data_contratacao: data_contratacao.val(),
        ativo: 'S'
      }, 'POST', csrftoken)
        .then(response => {
          if (!response.erro) {
            alertavel.find(".modal-body").text("Dados Gravados com Sucesso!");
            alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
            alertavel.modal("show");
            carregar_dados();
            modal_plans.modal("hide");
          } else {
            alertavel.find(".modal-body").text(response.erro);
            alertavel.modal("show");
          }
        })
        .catch(handleError);
    }
  };

  /**
   * Edita os dados de um aluno existente no backend.
   * @param {number} alunoId - O ID do aluno a ser editado.
   */
  const editarFormAluno = (alunoId) => {
    const formsData = [input_nome, input_email, input_cpf, input_celular];

    if (validateForm(formsData, 'Editar')) {
      normal_request(`/backend/alunos/atualizar/${alunoId}`, {
        celular: input_celular.val().replaceAll('(', '').replaceAll(')', '').replaceAll('-', '').replaceAll(' ', ''),
        cpf: input_cpf.val().replaceAll('.', '').replaceAll('-', ''),
        nascimento: input_nascimento.val(),
        email: input_email.val(),
        nome: input_nome.val(),
        sexo: input_sexo.val(),
        ativo: 'S'
      }, 'PUT', csrftoken)
        .then(response => {
          if (!response.erro) {
            alertavel.find(".modal-body").text("Dados editados com sucesso!");
            carregar_dados();
            modal.modal("hide");
            alertavel.modal("show");
          } else {
            alertavel.find(".modal-body").text(response.erro);
            alertavel.modal("show");
          }
        }).catch(handleError);
    }
  }

  /**
   * Manipula o clique no botão "Gravar" para adicionar ou editar um Aluno.
   * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnGravarClickHandler = (event) => {
    const { value } = event.target;
    value != -1 ? editarFormAluno(value) : gravarFormAluno();
  };

  /**
   * Manipula o clique no botão "Gravar" para adicionar ou editar um Aluno.
   * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnVinculoClickHandler = (event) => {
    const { value } = event.target;
    const aluno = $("#aluno_nome");
    const pacote = $("#pacotes");
    const data_contratacao = $("#contratacao");
    const formsData = [aluno, data_contratacao, pacote];

    validateForm(formsData);
    gravarPacoteAluno(value);
  };

  /**
  * Manipula o clique no botão "Novo Aluno" para abrir o modal de criação de Alunos.
  * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnNewAlunoClickHandler = (event) => {
    event.preventDefault();

    modal.find('input, select').val('');
    modal.find('.modal-title').text('Criação de Alunos');

    btnGravar.val("-1");

    modal.modal("show");
  };

  /**
   * Altera o status (ativo/inativo) de um usuário.
   * @param {number} planId - O ID do usuário cujo status será alterado.
   * @param {boolean} activate - Define se o usuário deve ser ativado (true) ou desativado (false).
  */
  const changeStatus = (alunoId, activate) => {
    const endpoint = `/backend/alunos/ativar_desativar/${alunoId}`;
    const token = csrftoken;
    const requestData = { ativar: activate ? 'S' : 'N' };

    normal_request(endpoint, requestData, 'PUT', token)
      .then(response => {
        const successMessage = response.msg || '';

        if (successMessage.includes('Aluno ativado') || successMessage.includes('Aluno desativado')) {
          carregar_dados();
        } else {
          console.error('Erro ao ativar/desativar aluno:', response.msg);
        }
      })
      .catch(handleError);
  };

  datatable.on("click", ".btn-ativo, .btn-inativo", function () {
    const alunoId = $(this).data("id");
    const activate = !$(this).hasClass("btn-ativo");

    changeStatus(alunoId, activate);
  });

  datatable.on("click", ".btn-delete", function () {
    const userId = $(this).data("id");
    openDeleteModal(userId);
  });

  modal_view.on("click", ".desativar_pacote", function () {
    const contratoId = $(this).data("id");
    openCancelModal(contratoId)
  });

  alertavel.on("click", ".close-modal", () => {
    alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
    alertavel.modal("hide");
  });

  modal.on("click", ".close-modal", () => {
    modal.modal("hide")
  });

  const btnGravar = $("#Gravar").click(btnGravarClickHandler);
  const btnGravarVinculo = $("#GravarVinculo").click(btnVinculoClickHandler);
  const btnNewAluno = $("#new_aluno").click(btnNewAlunoClickHandler);

  carregar_dados();
});
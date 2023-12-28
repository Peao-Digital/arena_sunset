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
    language: {
      noResults: function () {
        return "Nenhum pacote encontrado";
      }
    },
    escapeMarkup: function (markup) {
      return markup;
    }
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
  const handleError = (response) => {
    if (response.erro) {
      alertavel.find('.modal-body').html(response.erro).modal("show");
    } else {
      alertavel.find('.modal-body').html('Ocorreu um erro inesperado!').modal("show");
    }
  };

  /** Função de carregamento dos pacotes e select de pacotes.*/
  const carregar_pacotes = () => {
    const defaultOption = createOption('', 'Pacotes', true, true);

    normal_request('/backend/pacotes/listar', {}, 'GET', csrftoken)
      .then(response => {
        select_pacotes.empty().append(defaultOption);

        response.dados.filter(val => val.ativo !== 'N').forEach(val => {
          select_pacotes.append(createOption(val.id, val.nome));
        });
      })
      .catch(response => handleError);
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
            cpf || 'Não informado',
            data.email || 'Não informado',
            celular || 'Não informado',
            status,
            acoes
          ]);
        });

        // Desenha a tabela
        datatable.draw();
      })
      .catch(response => handleError);
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
    modal_view.find('.modal-footer').empty().html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);

    $('#current-plan').empty();
    $('#history').empty();

    // Função para criar campos de visualização
    const createField = (label, value, classes) => `
    <div class="labels-view ${classes}">
      <label><b>${label}</b> ${value}</label>
    </div>`;

    // Requisição para obter os dados do aluno
    normal_request(`/backend/alunos/ver/${alunoId}`, {}, 'GET', csrftoken)
      .then(response => {
        const { nome, cpf, celular, sexo, email, nascimento } = response.dados;

        const formatCPF = cpf => cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não Informado';
        const formatCelular = celular => celular ? celular.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4') : 'Não Informado';
        const formatSexo = sexo => sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Feminino' : 'Não informado';
        const formatNascimento = nascimento => nascimento !== null ? converter_data(nascimento) : 'Não informado';

        const userData = `
        ${createField('Nome:', nome || 'Não Informado', "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('CPF:', formatCPF(cpf), "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Sexo:', formatSexo(sexo), "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Celular:', formatCelular(celular), "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Email:', email || 'Não Informado', "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        ${createField('Data de nascimento:', formatNascimento(nascimento), "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
      `;

        $('#user-data').html(userData);
        modal_view.modal("show");
      })
      .catch(response => handleError);

    // Requisição para obter os pacotes do aluno
    normal_request(`/backend/alunos/${alunoId}/pacotes/buscar`, {}, 'GET', csrftoken)
      .then(response => {
        const ativos = response.dados;
        const historico = response.historico;

        const activePlans = ativos.filter(pacote => pacote.ativo === 'S');
        const historyPlans = historico.filter(pacote => pacote.desativado_em !== null);

        // Mapeia os pacotes ativos para o formato HTML
        const activePlansHTML = activePlans.map((pacote, index, array) => {
          const dataValidade = new Date(pacote.data_validade);
          const hoje = new Date();
          const diferencaEmDias = (dataValidade - hoje) / (1000 * 3600 * 24);

          let botaoRenovar = '';
          if (diferencaEmDias <= 7 && diferencaEmDias >= -14) {
            botaoRenovar = `<button class="btn btn-new renovar_pacote w-100" id="renovacao-${pacote.id}" type="button" data-id="${pacote.pacote__id}">Renovar</button> `;
          }
          console.log(pacote)
          // Constrói o HTML para o plano atual
          let planoHTML = `
              ${createField('', pacote.pacote__nome, "col-lg-2 col-md-2 col-sm-12 col-xs-12 mb-2")}
              ${createField('Início:', converter_data(pacote.data_contratacao), "col-lg-3 col-md-6 col-sm-6 col-xs-6 mb-2")}
              ${createField('Validade:', converter_data(pacote.data_validade), "col-lg-3 col-md-6 col-sm-6 col-xs-6 mb-2")}
              <div class="col-lg-2 col-md-2 col-sm-12 mb-1">
                ${botaoRenovar}
              </div>
              <div class="col-lg-2 col-md-2 col-sm-12 col-xs-12">
                <button class="btn btn-new desativar_pacote w-100" id="desativar_pacote" type="button" data-pacote="${pacote.pacote__id}" data-id="${pacote.id}">Desativar</button>
              </div>
              <div class="divRenovacao justify-content-center" id="divRenovacao-${pacote.pacote__id}" style="display:none;">
                <label for="contratacao" class="form-label"><b>Nova Data de Contratação</b></label>
                <input id="nova_contratacao-${pacote.pacote__id}" class="form-control" type="date" name="data_contratacao" required>
                <div class="mt-2 text-center">
                  <button class="btn btn-new gravar-renovacao" data-id=${pacote.id} data-pacote="${pacote.pacote__id}" data-aluno="${pacote.aluno}">Gravar</button>
                </div>
              </div>
              
              <div id="error-message-contratos" class="text-danger text-center mt-2 mb-2"></div>
              `;

          // Adiciona o <hr> se não for o último elemento
          if (index !== array.length - 1) {
            planoHTML += `<hr class="mb-2 mt-2">`;
          }

          return planoHTML;
        }).join('');

        const historyPlansHTML = historyPlans.map((pacote, index, array) => {
          let historyHTML = `
            ${createField('Pacote:', pacote.aluno_pacote__pacote__nome, "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
            ${createField('Início:', converter_data(pacote.data_contratacao), "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
            ${createField('Finalizado em:', converter_data(pacote.desativado_em), "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}`

          if (index !== array.length - 1) {
            historyHTML += `<hr class="mb-2 mt-2">`;
          }

          return historyHTML;
        }).join('');

        displaySection('#current-plan', activePlansHTML, 'Sem Pacotes Vinculados');
        displaySection('#history', historyPlansHTML, 'Sem Pacotes Anteriores');
      })
      .catch(response => handleError);
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
      $(sectionId).html(`<div class="col-12 text-center"> ${defaultMessage}</div> `);
    }
  };

  /**
  * Puxa os dados do usuário através da ID existente no backend para edição.
  * @param {number} alunoId - O ID do usuário a ser editado.
  */
  const openEditModal = (alunoId) => {
    modal.find('.modal-title').text(`Editando Aluno #${alunoId}`);
    $('#error-message').text('').hide();

    normal_request(`/backend/alunos/ver/${alunoId} `, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;
        input_email.val(dados.email);
        input_nome.val(dados.nome);
        select_sexo.val(dados.sexo).trigger("change");
        input_cpf.val(dados.cpf).unmask();
        input_nascimento.val(dados.nascimento);
        input_celular.val(dados.celular).unmask();

        btnGravar.val(dados.id);
        modal.modal("show");

        input_cpf.mask('000.000.000-00');
        input_celular.mask('(00) 0 0000-0000');
      })
      .catch(response => handleError);
  };

  /**
  * Abre o modal de remoção do aluno através da ID existente no backend.
  * @param {number} planId - O ID do aluno a ser deletado.
  */
  const openDeleteModal = (alunoId) => {
    // Primeiro verifica se o aluno tem contratos ativos ou histórico de contratos
    normal_request(`/backend/alunos/${alunoId}/pacotes/buscar`, {}, 'GET', csrftoken)
      .then(response => {
        const contratosAtivos = response.dados.some(contrato => contrato.ativo === 'S');
        const historicoExistente = response.historico && response.historico.length > 0;

        if (contratosAtivos || historicoExistente) {
          // Se tem contrato ativo ou histórico, mostra uma mensagem de erro
          alertavel.find('.modal-body').html("O aluno não pode ser excluído pois possui contratos ativos ou um histórico de contratos vinculados.");
          alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
          alertavel.modal("show");
        } else {
          // Se não tem contrato ativo nem histórico, mostra o modal de confirmação de exclusão
          alertavel.find('.modal-body').html("Tem certeza que deseja deletar o aluno?");
          alertavel.find('.modal-footer').html(`<button class="btn confirm-delete" data-aluno-id="${alunoId}">Deletar</button>`);
          alertavel.modal("show");

          $(".confirm-delete").off("click").click(function () {
            const id = $(this).attr("data-aluno-id");
            normal_request(`/backend/alunos/deletar/${id}`, {}, 'DELETE', csrftoken)
              .then(response => {
                handleResponse(response, alertavel, 'Registro Deletado com sucesso!');
              })
              .catch(response => handleError);
          });
        }
      })
      .catch(response => handleError);
  };

  /**
  * Abre o modal de remoção do aluno através da ID existente no backend.
  * @param {number} planId - O ID do aluno a ser deletado.
  */
  const openCancelModal = (planId) => {
    alertavel.find('.modal-body').empty();
    alertavel.find('.modal-footer').empty();

    alertavel.find('.modal-body').html("Tem certeza que deseja desativar o contrato ?");
    alertavel.find('.modal-footer').html(`<button class="btn confirm-disabled" data-id="${planId}">Desativar</button>`);
    alertavel.modal("show");
    modal_view.modal('hide');

    $(".confirm-disabled").off("click").click(function () {
      const id = $(this).data('id');

      normal_request(`/backend/pacotes/cancelar_contrato/${id} `, {}, 'put', csrftoken)
        .then(response => {
          handleResponse(response, alertavel, 'Contrato cancelado com sucesso!');
        })
        .catch(response => handleError);
    });
  };

  /**
  * Valida o formulário antes de Gravar os dados do Alunos.
  * @param {Array} formsData - Um array contendo os elementos do formulário.
  */
  const validateForm = (formsData, alert) => {
    if (formsData.some(form => !form || form.val().trim() === '')) {
      $("#error-message").text('Todos os campos devem ser preenchidos.').show();
      return false;
    }

    return true;
  };

  /**
   * Grava os dados do novo aluno no backend.
   */
  const gravarFormAluno = () => {
    const formsData = [input_nome];
    if (validateForm(formsData, alertError)) {
      normal_request('/backend/alunos/criar', {
        celular: input_celular.val().replaceAll('(', '').replaceAll(')', '').replaceAll('-', '').replaceAll(' ', ''),
        cpf: input_cpf.val().replaceAll('.', '').replaceAll('-', ''),
        nome: input_nome.val(),
        email: input_email.val(),
        sexo: select_sexo.val(),
        nascimento: input_nascimento.val() === '' ? null : input_nascimento.val(),
        ativo: 'S'
      }, 'POST', csrftoken)
        .then(response => {
          handleResponse(response, alertavel, 'Dados Gravados com Sucesso!');
        })
        .catch(response => handleError);
    }
  };

  /**
   * Grava o vinculo entre aluno e pacote no backend.
   */
  const gravarPacoteAluno = async (pacoteId, tipo, dados_renovacao) => {
    // Construção do objeto dados baseado no tipo
    let dados = {
      aluno: tipo === 'renovacao' ? dados_renovacao.aluno : $("#aluno_nome").data('id'),
      data_contratacao: tipo === 'renovacao' ? dados_renovacao.data_contratacao : $("#contratacao").val(),
      ativo: 'S'
    };

    // Validação específica para renovação
    if (tipo === 'renovacao' && (!dados_renovacao.data_contratacao || dados_renovacao.data_contratacao.trim() === '')) {
      $("#error-message-contratos").text('A nova data de contratação não pode ser vazia para renovar.').show();
      return;
    }

    // Validação para tipo diferente de renovação
    if (tipo !== 'renovacao') {
      const formsData = [$("#aluno_nome"), $("#contratacao"), $("#pacotes")];
      if (!validateForm(formsData, $("#error-message-pacotes"))) return;
    }

    normal_request(`/backend/pacotes/${pacoteId}/contratar`, dados, 'POST', csrftoken)
      .then(response => {
        handleResponse(response, alertavel, 'Dados Gravados com sucesso!');
        carregar_dados();
      });
  };

  /**
   * Edita os dados de um aluno existente no backend.
   * @param {number} alunoId - O ID do aluno a ser editado.
   */
  const editarFormAluno = (alunoId) => {
    const formsData = [input_nome, input_email, input_cpf, input_celular];

    if (validateForm(formsData, alertError)) {
      normal_request(`/backend/alunos/atualizar/${alunoId}`, {
        celular: input_celular.val().replaceAll('(', '').replaceAll(')', '').replaceAll('-', '').replaceAll(' ', ''),
        cpf: input_cpf.val().replaceAll('.', '').replaceAll('-', ''),
        nascimento: input_nascimento.val(),
        email: input_email.val(),
        nome: input_nome.val(),
        sexo: select_sexo.val(),
        ativo: 'S'
      }, 'PUT', csrftoken)
        .then(response => {
          handleResponse(response, alertavel, 'Dados editados com sucesso!');
        }).catch(response => handleError);
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
    gravarPacoteAluno(value, 'gravacao', {});
  };

  /**
  * Manipula o clique no botão "Novo Aluno" para abrir o modal de criação de Alunos.
  * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnNewAlunoClickHandler = (event) => {
    event.preventDefault();

    modal.find('input, select').val('');
    modal.find('.modal-title').text('Criação de Alunos');
    select_sexo.val('').trigger("change");

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
        handleResponse(response, alertavel, 'Status Alterado com sucesso!');
        carregar_dados();
      })
      .catch(response => handleError);
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

  $(document).on('click', '.renovar_pacote', function () {
    console.log($(this));
    // Pega o ID do pacote que está sendo renovado.
    const pacoteId = $(this).data('id');

    // Calcula o primeiro dia do próximo mês.
    const hoje = new Date();
    const primeiroDiaProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

    // Formata a data para o formato apropriado (yyyy-mm-dd).
    const dataFormatada = primeiroDiaProximoMes.toISOString().split('T')[0];

    // Seleciona o campo de data de renovação correspondente ao pacote e atualiza seu valor.
    $(`#divRenovacao-${pacoteId} input[name='data_contratacao']`).val(dataFormatada);
    $(`#divRenovacao-${pacoteId}`).css('display', 'block');
  });

  $(document).on('click', '.gravar-renovacao', function () {
    const pacote_id = $(this).data('pacote');
    const nova_data = $(`#nova_contratacao-${pacote_id}`).val();
    const pacote = $(this).data('pacote');

    const dados = {
      data_contratacao: nova_data,
      aluno: $(this).data('aluno'),
    }

    gravarPacoteAluno(pacote, 'renovacao', dados);
  });

  $(document).on('click', '.btn-edit', function () {
    const alunoId = $(this).data('id');
    openEditModal(alunoId);
  });

  $(document).on('click', '.btn-view', function () {
    const alunoId = $(this).data('id');
    openViewModal(alunoId);
  });

  $(document).on('click', '.btn-plans', function () {
    const alunoId = $(this).data('id');
    const alunoNome = $(this).data('nome');
    openPlansModal(alunoId, alunoNome);
  });

  carregar_dados();
});
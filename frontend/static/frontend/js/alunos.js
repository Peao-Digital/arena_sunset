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

  const select_pacotes = $("#pacotes").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Pacotes",
  }).change(function () {
    btnGravarVinculo.val($(this).val());
  })

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

  /** Função de carregamento dos grupos e select de grupos.*/

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
        json.dados.forEach(val => {
          option = $("<option>").val(val.id).text(val.nome);
          select_pacotes.append(option)
        });
      })
      .catch(handleError);
  };

  /**
   * Função de carregamento dos dados e tabela datatable
   */
  const carregar_dados = () => {
    normal_request('/backend/alunos/listar', {}, 'GET', csrftoken)
      .then(json => {
        datatable.clear();

        json.dados.forEach(data => {
          const acoes = `
            <button class="btn btn-view" data-id="${data.id}" title="Ver Dados"><i class="fas fa-eye"></i></button>
            <button class="btn btn-edit" data-id="${data.id}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-delete" data-id="${data.id}" title="Deletar"><i class="fas fa-trash"></i></button>
            <button class="btn btn-plans" data-id="${data.id}" data-nome="${data.nome}" title="Ver Pacotes"><i class="fa-solid fa-address-card"></i></button>`;

          const status = data.ativo === 'S' ? `<button class="btn btn-ativo" data-id="${data.id}" title="Mudar status para Inativo">Ativo</button>` : `<button class="btn btn-inativo" data-id="${data.id}" title="Mudar status para Ativo">Inativo</button>`;
          const cpf = data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          const celular = data.celular.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');

          datatable.row.add([
            data.nome,
            cpf,
            data.email,
            celular,
            status,
            acoes
          ]);
        });

        datatable.draw();

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
          console.log(alunoNome);
          openPlansModal(alunoId, alunoNome);
        });
      })
      .catch(handleError);
  };

  /**
   * Puxa os dados de pacotes através da ID do usuário.
   * @param {number} alunoId - O ID do usuário a ser enviado.
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
   * Puxa os dados do usuário através da ID existente no backend para visualização.
   * @param {number} alunoId - O ID do usuário a ser visualizado.
   */
  const openViewModal = (alunoId) => {
    modal_view.find('.modal-title').text(`Dados do Aluno #${alunoId}`);
    $('#current-plan').empty();
    $('#history').empty();

    const createField = (label, value, classes) => `
    <div class="labels-view ${classes}">
      <label><b>${label}:</b> ${value}</label>
    </div>`;

    normal_request(`/backend/alunos/ver/${alunoId}`, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;

        const userData = `
          ${createField('Nome', dados.nome, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
          ${createField('CPF', dados.cpf, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
          ${createField('Celular', dados.celular, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
          ${createField('Email', dados.email, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
        `;

        $('#user-data').html(userData);
        modal_view.modal("show");
      }).catch(handleError);

    normal_request(`/backend/alunos/${alunoId}/pacotes/buscar`, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;

        const currentPlan = dados.filter(pacote => pacote.ativo === 'S' && pacote.desativado_em === null).map(pacote => `
            ${createField('Pacote', pacote.pacote__nome, "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
            ${createField('Data de Validade', converter_data(pacote.data_validade), "col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2")}
            <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12 mb-2">
              <button class="btn btn-new desativar_pacote" id="desativar_pacote" type="button" data-id="${pacote.id}">Desativar</button>
            </div>
          `).join('');

        const history = dados.filter(pacote => pacote.desativado_em !== null).map(pacote => `
            ${createField('Nome', pacote.pacote__nome, "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
            ${createField('Finalizado em', converter_data(pacote.desativado_em), "col-lg-6 col-md-6 col-sm-12 col-xs-12 mb-2")}
          `).join('');

        if (currentPlan.length > 0) {
          $('#current-plan').html(currentPlan);
        } else {
          $('#current-plan').html('<div class="col-12 text-center">Sem Pacotes Vinculados</div>');
        }

        if (history.length > 0) {
          $('#history').html(history);
        } else {
          $('#history').html('<div class="col-12 text-center">Sem Pacotes Anteriores</div>');
        }
      })
      .catch(handleError);
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
            console.error('Erro ao deletar aluno:', response.message);
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
            console.error('Erro ao cancelar contrato:', response.message);
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
    const formsData = [input_nome, input_email, input_cpf, input_celular];

    if (validateForm(formsData)) {
      normal_request('/backend/alunos/criar', {
        nome: input_nome.val(),
        cpf: input_cpf.val().replaceAll('.', '').replaceAll('-', ''),
        celular: input_celular.val().replaceAll('(', '').replaceAll(')', '').replaceAll('-', '').replaceAll(' ', ''),
        email: input_email.val(),
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
    const data_contratacao = $("#validade");
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
        email: input_email.val(),
        nome: input_nome.val(),
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
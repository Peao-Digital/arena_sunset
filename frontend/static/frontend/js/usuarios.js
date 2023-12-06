$(document).ready(() => {
  const csrftoken = getCSRFToken();

  const dataTablePT_BR = "/static/frontend/js/libs/dataTables.portuguese.json";
  const alertError = $("#error-message");
  const alertavel = $("#alertavel");
  const modal = $("#modal-form");

  const input_cpf = $('#cpf');
  const input_nome = $("#nome");
  const input_senha = $("#senha");
  const input_email = $("#email");
  const input_usuario = $("#usuario");
  const input_sobrenome = $("#sobrenome");
  const input_conf_senha = $("#conf_senha");

  input_cpf.mask('000.000.000-00');

  const select_grupo = $("#grupo").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Grupo"
  });

  const datatable = $("#datatable-user").DataTable({
    searching: true,
    language: {
      url: dataTablePT_BR,
    },
  });

  /** Função de validação dos dados.*/
  const handleError = (error) => {
    console.error(error);
  };

  /** Função de carregamento dos grupos e select de grupos.*/
  const carregar_grupos = () => {
    const defaultOption = $('<option>', {
      value: '',
      text: 'Grupo',
      selected: true,
      disabled: true,
    });

    normal_request('/backend/grupos/buscar', {}, 'GET', csrftoken)
      .then(json => {

        let option;
        select_grupo.empty().append(defaultOption);

        json.dados.forEach(val => {
          option = $("<option>").val(val.id).text(val.name);
          select_grupo.append(option)
        });
      })
      .catch(handleError);
  };

  /**
   * Função de carregamento dos dados e tabela datatable
   */
  const carregar_dados = () => {
    normal_request('/backend/usuarios/buscar', {}, 'GET', csrftoken)
      .then(json => {
        datatable.clear();

        json.dados.forEach(data => {
          const user_grupos = data.grupos ? data.grupos.join(', ') : 'Nenhum grupo';

          const acoes = `<button class="btn btn-edit" data-id="${data.id}" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn btn-delete" data-id="${data.id}" title="Deletar"><i class="fas fa-trash"></i></button>`;

          const status = data.ativo === true ? `<button class="btn btn-ativo" data-id="${data.id}" title="Mudar status para Inativo">Ativo</button>` : `<button class="btn btn-inativo" data-id="${data.id}" title="Mudar status para Ativo">Inativo</button>`;

          datatable.row.add([
            data.nome + " " + data.sobrenome,
            user_grupos,
            status,
            acoes
          ]);
        });

        datatable.draw();

        $('.btn-edit').click(function () {
          const userId = $(this).data('id');
          carregar_grupos();
          openEditModal(userId);
        });
      })
      .catch(handleError);
  };

  /**
   * Valida o formulário antes de gravar os dados do usuário.
   * @param {Array} formsData - Um array contendo os elementos do formulário.
   */
  const validateForm = (formsData, tipo) => {
    if (tipo === 'Editar') {
      console.log(formsData);
      if (formsData.some(form => !form || form.val().trim() === '')) {
        alertError.text('Todos os campos devem ser preenchidos.').show();
        return false;
      }
    } else {
      if (formsData.some(form => !form || form.val().trim() === '')) {
        alertError.text('Todos os campos devem ser preenchidos.').show();
        return false;
      }

      if (input_senha.val() !== input_conf_senha.val()) {
        input_senha.addClass('is-invalid');
        input_conf_senha.addClass('is-invalid');
        alertError.text('As senhas não coincidem.').show();
        return false;
      }
    }

    return true;
  };


  /**
   * Puxa os dados do usuário através da ID existente no backend para edição.
   * @param {number} userId - O ID do usuário a ser editado.
   */
  const openEditModal = (userId) => {
    modal.find('.modal-title').text(`Editando usuário #${userId}`);
    $('#error-message').text('').hide();
    $('#senha, #conf_senha').prop('required', false);
    $('#senha, #conf_senha').removeAttr('required');
    select_grupo.empty();

    normal_request(`/backend/usuarios/ver/${userId}`, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;

        select_grupo.val(dados.grupos_id).trigger("change");
        input_sobrenome.val(dados.sobrenome);
        input_usuario.val(dados.usuario);
        input_email.val(dados.email);
        input_nome.val(dados.nome);
        input_cpf.val(dados.cpf).unmask();

        btnGravar.val(dados.id);
        modal.modal("show");

        input_cpf.mask('000.000.000-00');
      })
      .catch(handleError);
  };

  /**
   * Abre o modal de remoção do usuário através da ID existente no backend.
   * @param {number} userId - O ID do usuário a ser deletado.
   */
  const openDeleteModal = (userId) => {
    alertavel.find('.modal-body').empty();
    alertavel.find('.modal-footer').empty();

    alertavel.find('.modal-body').html("Tem certeza que deseja deletar o usuário ?");
    alertavel.find('.modal-footer').html(`<button class="btn confirm-delete">Deletar</button>`);
    alertavel.modal("show");

    $(".confirm-delete").off("click").click(() => {
      normal_request(`/backend/usuarios/deletar/${userId}`, {}, 'DELETE', csrftoken)
        .then(response => {
          const successMessage = response.msg || ''

          if (successMessage.includes('Usuário deletado!')) {
            alertavel.find('.modal-body').html(`O registro foi deletado com sucesso!`);
            alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
            carregar_dados();
          } else {
            console.error('Erro ao deletar usuário:', response.message);
          }
        })
        .catch(handleError);
    });
  };

  /**
   * Grava os dados do novo usuário no backend.
   */
  const gravarFormUser = () => {
    const formsData = [input_nome, input_sobrenome, input_usuario, input_email, input_senha, input_conf_senha, input_cpf, select_grupo];
    alertError.hide();

    if (validateForm(formsData, 'Gravar')) {
      normal_request('/backend/usuarios/criar', {
        usuario: input_usuario.val(),
        senha: input_senha.val(),
        nome: input_nome.val(),
        sobrenome: input_sobrenome.val(),
        email: input_email.val(),
        cpf: input_cpf.val().replaceAll('.', '').replaceAll('-', ''),
        grupo: select_grupo.val()
      }, 'POST', csrftoken)
        .then(response => {
          if (!response.erro) {
            alertavel.find(".modal-body").text("Dados Gravados com Sucesso!");
            alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);

            alertavel.modal("show");
            modal.modal("hide");
            carregar_dados();
          } else {
            alertavel.find(".modal-body").text(response.erro);
            alertavel.modal("show");
          }
        })
        .catch(handleError);
    }
  };

  /**
   * Edita os dados de um usuário existente no backend.
   * @param {number} userId - O ID do usuário a ser editado.
   */
  const editarFormUser = (userId) => {
    const formsData = [input_nome, input_sobrenome, input_usuario, input_email, input_cpf, select_grupo];

    if (validateForm(formsData, 'Editar')) {
      normal_request(`/backend/usuarios/atualizar/${userId}`, {
        cpf: input_cpf.val().replaceAll('.', '').replaceAll('-', ''),
        sobrenome: input_sobrenome.val(),
        usuario: input_usuario.val(),
        grupo: select_grupo.val(),
        email: input_email.val(),
        senha: input_senha.val(),
        nome: input_nome.val(),
      }, 'PUT', csrftoken)
        .then(response => {
          if (!response.erro) {
            alertavel.find(".modal-body").text("Dados editados com sucesso!");
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
   * Manipula o clique no botão "Gravar" para adicionar ou editar um usuário.
   * @param {Event} event - O objeto de evento associado ao clique no botão.
  */

  const btnGravarClickHandler = (event) => {
    const { value } = event.target;
    value != -1 ? editarFormUser(value) : gravarFormUser();
  };

  /**
  * Manipula o clique no botão "Novo Usuário" para abrir o modal de criação de usuários.
  * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnNewUserClickHandler = (event) => {
    event.preventDefault();
    carregar_grupos();

    modal.find('input, select').val('');
    modal.find('.modal-title').text('Criação de usuários');

    btnGravar.val("-1");
    $('#senha, #conf_senha').prop('disabled', false);
    $('#senha, #conf_senha').prop('required', true);

    modal.modal("show");
  };

  /**
   * Altera o status (ativo/inativo) de um usuário.
   * @param {number} userId - O ID do usuário cujo status será alterado.
   * @param {boolean} activate - Define se o usuário deve ser ativado (true) ou desativado (false).
   */
  const changeStatus = (userId, activate) => {
    const endpoint = `/backend/usuarios/ativar_desativar/${userId}`;
    const token = csrftoken;
    const requestData = { ativar: activate };

    normal_request(endpoint, { requestData }, 'PUT', token)
      .then(response => {
        const successMessage = response.msg || ''

        if (successMessage.includes('Usuário ativado') || successMessage.includes('Usuário desativado')) {
          carregar_dados();
        } else {
          console.error('Erro ao ativar/desativar usuário:', response.msg);
        }
      })
      .catch(handleError);
  };

  datatable.on("click", ".btn-delete", function () {
    const userId = $(this).data("id");
    openDeleteModal(userId);
  });

  datatable.on("click", ".btn-ativo, .btn-inativo", function () {
    const userId = $(this).data("id");
    const activate = !$(this).hasClass("btn-ativo"); // Inverte o estado atual

    changeStatus(userId, activate);
  });

  alertavel.on("click", ".close-modal", () => {
    alertavel.find('.modal-footer').html(`< button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
    alertavel.modal("hide");
  });

  modal.on("click", ".close-modal", () => {
    modal.modal("hide")
  });

  const btnGravar = $("#Gravar").click(btnGravarClickHandler);
  const btnNewUser = $("#new_user").click(btnNewUserClickHandler);

  carregar_dados();

});
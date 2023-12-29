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

  const datatable = $("#datatable-user").DataTable({
    searching: true,
    responsive: true,
    rowReorder: true,
    language: {
      url: dataTablePT_BR,
    },
  });

  const select_grupo = $("#grupo").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Selecione o Grupo",
  });

  /** Função de validação dos dados.*/
  const handleError = (response) => {
    if (response.erro) {
      alertavel.find('.modal-body').html(response.erro).modal("show");
    } else {
      alertavel.find('.modal-body').html('Ocorreu um erro inesperado!').modal("show");
    }
  };

  /** Função de carregamento dos grupos e select de grupos.*/
  const carregar_grupos = () => {

    const defaultOption = createOption('', 'Grupo', true, true);
    normal_request('/backend/grupos/buscar', {}, 'GET', csrftoken)
      .then(response => {
        select_grupo.empty().append(defaultOption);

        response.dados.forEach(val => {
          select_grupo.append(createOption(val.id, val.name));
        });
      })
      .catch(response => handleError);
  };

  /**
   * Função de carregamento dos dados e tabela datatable
   */
  const carregar_dados = () => {
    normal_request('/backend/usuarios/buscar', {}, 'GET', csrftoken)
      .then(response => {
        datatable.clear();

        response.dados.forEach(data => {
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
      })
      .catch(response => handleError);
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
        
        $("#imagem_atual").attr('src', dados.foto == ''? '/static/frontend/img/usuario.png': dados.foto)
        modal.modal("show");

        input_cpf.mask('000.000.000-00');
      })
      .catch(response => handleError);
  };

  /**
   * Abre o modal de remoção do usuário através da ID existente no backend.
   * @param {number} userId - O ID do usuário a ser deletado.
   */
  const openDeleteModal = (userId) => {
    alertavel.find('.modal-body').empty();
    alertavel.find('.modal-footer').empty();
    alertavel.find('.modal-body').html("Tem certeza que deseja remover o colaborador ?");
    alertavel.find('.modal-footer').html(`<button class="btn confirm-delete" data-id='${userId}'>Deletar</button>`);
    alertavel.modal("show");
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
        let imagem = document.getElementById('foto')
        if (!response.erro) {
          if (imagem.files.length == 0) {
            handleResponse(response, alertavel, 'Dados Gravados com Sucesso!');
          } else {
            salvarImagem(response.id, imagem)
          }
        } else {
          handleResponse(response, alertavel, '');
        }
      })
      .catch(response => handleError);
    }
  };

  const salvarImagem = async (id, imagem) => {
    let formData = new FormData();           
    formData.append("foto", imagem.files[0]);

    form_data_request('/backend/usuarios/foto/gravar/' + id, formData, 'POST', csrftoken)
    .then(json => {
      handleResponse(json, alertavel, 'Dados Gravados com Sucesso!');
    })
    .catch(response => handleError);
  }

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
          let imagem = document.getElementById('foto')
          if (!response.erro) {
            if (imagem.files.length == 0) {
              handleResponse(response, alertavel, 'Dados Gravados com Sucesso!');
            } else {
              salvarImagem(userId, imagem)
            }
          } else {
            handleResponse(response, alertavel, '');
          }
        }).catch(response => handleError);
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
  * Manipula o clique no botão "Novo Usuário" para abrir o modal de Criação de colaboradores.
  * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnNewUserClickHandler = (event) => {
    event.preventDefault();
    carregar_grupos();

    $("#imagem_atual").attr('src', '/static/frontend/img/usuario.png')

    modal.find('input, select').val('');
    modal.find('.modal-title').text('Criação de colaboradores');

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
        handleResponse(response, alertavel, 'Status Alterado com Sucesso!');
      })
      .catch(response => handleError);
  };

  $('#imageInput').on('change', function () {
    let $input = $(this);

    if ($input.val().length > 0) {
      let fileReader = new FileReader();
      fileReader.onload = function (data) {
        $('.image-preview').attr('src', data.target.result);
      }
      fileReader.readAsDataURL($input.prop('files')[0]);
      $('.image-button').css('display', 'none');
      $('.image-preview').css('display', 'flex');
      $('.change-image').css('display', 'flex');
    }
  });

  $('.change-image').on('click', function () {
    let $control = $(this);

    $('#imageInput').val('');
    let $preview = $('.image-preview');

    $preview.attr('src', '');
    $preview.css('display', 'none');
    $control.css('display', 'none');
    $('.image-button').css('display', 'flex');
  });

  datatable.on("click", ".btn-delete", function () {
    const userId = $(this).data("id");
    openDeleteModal(userId);
  });

  datatable.on("click", ".btn-ativo, .btn-inativo", function () {
    const userId = $(this).data("id");
    const activate = !$(this).hasClass("btn-ativo");

    changeStatus(userId, activate);
  });

  alertavel.on("click", ".close-modal", () => {
    alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
    alertavel.modal("hide");
  });

  modal.on("click", ".close-modal", () => {
    modal.modal("hide")
  });

  $(document).on('click', '.confirm-delete', function () {
    const id = $(this).data('id');
    normal_request(`/backend/usuarios/deletar/${id}`, {}, 'DELETE', csrftoken)
      .then(response => {
        handleResponse(response, alertavel, 'Usuário deletado!');
      })
      .catch(response => handleError);
  });

  $(document).on('click', '.btn-edit', function () {
    const userId = $(this).data('id');
    carregar_grupos();
    openEditModal(userId);
  });

  const btnGravar = $("#Gravar").click(btnGravarClickHandler);
  const btnNewUser = $("#new_user").click(btnNewUserClickHandler);

  carregar_dados();

});
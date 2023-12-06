$(document).ready(() => {
  const dataTablePT_BR = "/static/frontend/js/libs/dataTables.portuguese.json";
  const alertError = $("#error-message");
  const alertavel = $("#alertavel");
  const btnGravar = $("#Gravar");
  const modal = $("#modal-form");
  const btnNewUser = $("#new_user");
  const datatable = $("#datatable-user");

  const cpf = $('#cpf');
  const nome = $("#nome");
  const senha = $("#senha");
  const email = $("#email");
  const grupo = $("#grupo");
  const usuario = $("#usuario");
  const sobrenome = $("#sobrenome");
  const conf_senha = $("#conf_senha");

  cpf.mask('000.000.000-00');

  const renderUsuarioRow = ({ id, nome, ativo, grupos }) => {
    const user_grupos = grupos ? grupos.join(', ') : 'Nenhum grupo';

    const acoes = `
      <button class="btn btn-edit" data-id="${id}" title="Editar"><i class="fas fa-edit"></i></button>
      <button class="btn btn-delete" data-id="${id}" title="Deletar"><i class="error-icon fas fa-trash"></i></button>`;

    const status = ativo === true ? `<button class="btn btn-ativo" data-id="${id}" title="Mudar status para Inativo">Ativo</button>` : `<button class="btn btn-inativo" data-id="${id}" title="Mudar status para Ativo">Inativo</button>`;

    return `
      <tr>
        <td>${nome}</td>
        <td>${user_grupos}</td>
        <td>${status}</td>
        <td>${acoes}</td>
      </tr>
    `;
  };

  const load_grupos = () => {
    const defaultOption = $('<option>', {
      value: '',
      text: 'Grupo',
      selected: true,
      disabled: true,
    });

    grupo.empty().append(defaultOption);

    normal_request('/backend/grupos/buscar', {}, 'GET', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(json => {
        json.dados.forEach(val => {
          grupo.append($('<option>', {
            value: val.id,
            text: val.name
          }));
        });
      })
      .catch(error => console.error(error));
  };

  const load_usuario = () => {
    normal_request('/backend/usuarios/buscar', {}, 'GET', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(json => {
        const tbody = $('#datatable-user tbody');
        tbody.empty();

        json.dados.forEach(data => {
          tbody.append(renderUsuarioRow(data));
        });

        $('.btn-edit').click(function () {
          const userId = $(this).data('id');
          openEditModal(userId);
        });
      })
      .catch(error => console.error(error));
  };

  const gravar = () => {
    const formsData = [nome, sobrenome, usuario, email, senha, conf_senha, cpf, grupo];

    // Verificar se algum campo está vazio
    if (formsData.some(form => form.val().trim() === '')) {
      alertError.text('Todos os campos devem ser preenchidos.').show();
      return;
    }

    const senhaVal = senha.val();
    const confirmacaoSenhaVal = conf_senha ? conf_senha.val() : '';

    if (senhaVal !== confirmacaoSenhaVal) {
      senha.addClass('is-invalid');
      conf_senha.addClass('is-invalid');
      alertError.text('As senhas não coincidem.').show();
      return;
    }

    alertError.hide();

    const formData = {
      usuario: usuario.val(),
      senha: senhaVal,
      nome: nome.val(),
      sobrenome: sobrenome.val(),
      email: email.val(),
      cpf: cpf.val(),
      grupo: grupo.val(),
    };

    normal_request('/backend/usuarios/criar', formData, 'POST', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(response => {
        if (!response.erro) {
          modal.modal("hide");
          load_usuario();
        } else {
          console.log(response.erro);
        }
      })
      .catch(error => console.error(error));
  };

  const edit = () => {
    console.log("editou");
  };

  const openEditModal = (userId) => {
    load_grupos();
    modal.find('.modal-title').text(`Editando usuário #${userId}`);

    $('#error-message').text('').hide();
    $('#senha, #conf_senha').prop('disabled', true);
    $('#senha, #conf_senha').prop('required', false);
    $('#senha, #conf_senha').removeAttr('required');
    $('#senha, #conf_senha').removeClass('is-invalid');

    normal_request(`/backend/usuarios/ver/${userId}`, {}, 'GET', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(response => {

        if (response.dados) {
          const dados = response.dados;
          nome.val(dados.nome);
          sobrenome.val(dados.sobrenome);
          usuario.val(dados.usuario);
          email.val(dados.email);
          btnGravar.attr('data-id', dados.id);

          modal.modal("show");
        } else {
          console.error('Nenhum dado encontrado para o usuário com ID:', userId);
        }
      })
      .catch(error => console.error(error));
  };

  const openDeleteModal = (userId) => {
    alertavel.find('.modal-body').empty();
    alertavel.find('.modal-footer').empty();

    alertavel.find('.modal-body').html("Tem certeza que deseja deletar o usuário ?");
    alertavel.find('.modal-footer').html(`<button class="btn confirm-delete">Deletar</button>`);
    alertavel.modal("show");

    $(".confirm-delete").off("click").click(() => {
      normal_request(`/backend/usuarios/deletar/${userId}`, {}, 'DELETE', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
        .then(response => {
          const successMessage = response.msg || ''

          if (successMessage.includes('Usuário deletado!')) {
            alertavel.modal("hide");
            load_usuario();
          } else {
            console.error('Erro ao deletar usuário:', response.message);
          }
        })
        .catch(error => console.error(error));
    });
  };

  const changeStatus = (userId, activate) => {
    const endpoint = `/backend/usuarios/ativar_desativar/${userId}`;
    const token = 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws';
    const requestData = { ativar: activate };

    normal_request(endpoint, { requestData }, 'PUT', token)
      .then(response => {
        const successMessage = response.msg || ''

        if (successMessage.includes('Usuário ativado') || successMessage.includes('Usuário desativado')) {
          load_usuario();
        } else {
          console.error('Erro ao ativar/desativar usuário:', response.msg);
        }
      })
      .catch(error => console.error(error));
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

  modal.on("click", ".close-modal", () => modal.modal("hide"));

  btnGravar.click((event) => {
    event.preventDefault();
    const id = btnGravar.data('id');

    if (id !== undefined) {
      edit();
    } else {
      gravar();
    }
  });

  btnNewUser.click((event) => {
    load_grupos();
    event.preventDefault();

    modal.find('input, select').val('');
    modal.find('.modal-title').text('Criação de usuários');

    btnGravar.removeAttr('data-id');
    $('#senha, #conf_senha').prop('disabled', false);
    $('#senha, #conf_senha').prop('required', true);

    modal.modal("show");
  });

  datatable.DataTable({
    searching: true,
    language: {
      url: dataTablePT_BR,
    },
  });

  load_usuario();
});
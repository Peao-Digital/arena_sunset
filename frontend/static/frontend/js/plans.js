$(document).ready(function () {
  const dataTablePT_BR = "/static/frontend/js/libs/dataTables.portuguese.json";
  const alertError = $("#error-message");
  const alertavel = $("#alertavel");
  const btnGravar = $("#Gravar");
  const modal = $("#modal-form");
  const btnNewPlan = $("#new_plan");
  const datatable = $("#datatable-plan");

  const nome = $("#nome");
  const valor = $("#valor");
  const qtd_aulas_semana = $("#qtd_aulas");
  const qtd_participantes = $("#qtd_participantes");
  const ativo = $("#ativo");

  valor.mask('000.000.000.000.000,00', { reverse: true });

  const renderPlansRow = ({ id, nome, qtd_aulas_semana, qtd_participantes, valor, ativo }) => {

    const acoes = `
      <button class="btn btn-edit" data-id="${id}" title="Editar"><i class="fas fa-edit"></i></button>
      <button class="btn btn-delete" data-id="${id}" title="Deletar"><i class="error-icon fas fa-trash"></i></button>`;

    const status = ativo === true ? `<button class="btn btn-ativo" data-id="${id}" title="Mudar status para Inativo">Ativo</button>` : `<button class="btn btn-inativo" data-id="${id}" title="Mudar status para Ativo">Inativo</button>`;

    return `
      <tr>
        <td>${nome}</td>
        <td>${qtd_aulas_semana}</td>
        <td>${qtd_participantes}</td>
        <td>R$ ${valor}</td>
        <td>${status}</td>
        <td>${acoes}</td>
      </tr>
    `;
  };

  const load_plans = () => {
    normal_request('/backend/pacotes/listar', {}, 'GET', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(json => {
        const tbody = $('#datatable-plan tbody');
        tbody.empty();

        json.dados.forEach(data => {
          tbody.append(renderPlansRow(data));
        });

        $('.btn-edit').click(function () {
          const planId = $(this).data('id');
          openEditModal(planId);
        });
      })
      .catch(error => console.error(error));
  };

  const openDeleteModal = (planId) => {
    alertavel.find('.modal-body').empty();
    alertavel.find('.modal-footer').empty();

    alertavel.find('.modal-body').html("Tem certeza que deseja deletar o plano ?");
    alertavel.find('.modal-footer').html(`<button class="btn confirm-delete">Deletar</button>`);
    alertavel.modal("show");

    $(".confirm-delete").off("click").click(() => {
      normal_request(`/backend/pacotes/deletar/${planId}`, {}, 'DELETE', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
        .then(response => {
          const successMessage = response.msg || ''

          if (successMessage.includes('O registro foi deletado com sucesso!')) {
            alertavel.modal("hide");
            load_plans();
          } else {
            console.error('Erro ao deletar pacote:', response.message);
          }
        })
        .catch(error => console.error(error));
    });
  };

  const gravar = () => {
    const inputs = [nome, valor, qtd_aulas_semana, qtd_participantes];

    // Verificar se algum campo está vazio
    if (inputs.some(input => !input.val().trim())) {
      alertError.text('Todos os campos devem ser preenchidos.').show();
      return;
    }

    alertError.hide();

    const formData = {
      nome: nome.val(),
      valor: parseFloat(valor.val().replace(',', '.')),
      qtd_aulas_semana: qtd_aulas_semana.val(),
      qtd_participantes: qtd_participantes.val(),
      ativo: 'S'
    };

    console.log(valor.val())

    normal_request('/backend/pacotes/criar', formData, 'POST', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(response => {
        if (!response.erro) {
          modal.modal("hide");
          load_plans();
        } else {
          console.log(response.erro);
        }
      })
      .catch(error => console.error(error));
  };

  /*** aqui falta a rota */
  const changeStatus = (planId, activate) => {
    const endpoint = `/backend/usuarios/ativar_desativar/${planId}`;
    const token = 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws';
    const requestData = { ativar: activate };

    normal_request(endpoint, { requestData }, 'PUT', token)
      .then(response => {
        const successMessage = response.msg || ''

        if (successMessage.includes('Usuário ativado') || successMessage.includes('Usuário desativado')) {
          load_plans();
        } else {
          console.error('Erro ao ativar/desativar usuário:', response.msg);
        }
      })
      .catch(error => console.error(error));
  };

  btnNewPlan.click((event) => {
    event.preventDefault();
    modal.find('input').val('');
    modal.find('.modal-title').text('Criação de pacotes');

    btnGravar.removeAttr('data-id');

    modal.modal("show");
  })

  datatable.on("click", ".btn-delete", function () {
    const planId = $(this).data("id");
    openDeleteModal(planId);
  });

  datatable.on("click", ".btn-ativo, .btn-inativo", function () {
    const planId = $(this).data("id");
    const activate = !$(this).hasClass("btn-ativo"); // Inverte o estado atual

    changeStatus(planId, activate);
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

  datatable.DataTable({
    searching: true,
    language: {
      url: dataTablePT_BR,
    },
  });

  load_plans();
});
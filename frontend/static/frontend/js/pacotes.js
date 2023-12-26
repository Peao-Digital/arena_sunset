$(document).ready(() => {
  const csrftoken = getCSRFToken();

  const dataTablePT_BR = "/static/frontend/js/libs/dataTables.portuguese.json";
  const alertError = $("#error-message");
  const alertavel = $("#alertavel");
  const modal = $("#modal-form");

  const input_nome = $("#nome");
  const input_valor = $("#valor");

  const select_qtd_participantes = $("#qtd_participantes").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Participantes"
  });

  const select_qtd_aulas_semana = $("#qtd_aulas").select2({
    minimumResultsForSearch: Infinity,
    placeholder: "Aulas Semanais"
  })

  input_valor.mask("###0,00", { reverse: true });

  const datatable = $("#datatable-plan").DataTable({
    searching: true,
    language: {
      url: dataTablePT_BR,
    },
  });

  const handleError = (error) => {
    console.error(error);
  };

  /**
   * Função de carregamento dos dados e tabela datatable
   */
  const carregar_dados = () => {
    normal_request('/backend/pacotes/listar', {}, 'GET', csrftoken)
      .then(json => {
        datatable.clear();

        json.dados.forEach(({ id, nome, qtd_aulas_semana, qtd_participantes, valor, ativo }) => {
          const acoes = `<button class="btn btn-edit" data-id="${id}" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn btn-delete" data-id="${id}" title="Deletar"><i class="fas fa-trash"></i></button>`;

          const status = ativo === 'S' ? `<button class="btn btn-ativo" data-id="${id}" title="Mudar status para Inativo">Ativo</button>` : `<button class="btn btn-inativo" data-id="${id}" title="Mudar status para Ativo">Inativo</button>`;
          let qtd_alunos_texto;

          switch (qtd_participantes) {
            case 1:
              qtd_alunos_texto = 'Individual';
              break;
            case 2:
              qtd_alunos_texto = 'Duplas';
              break;
            case 3:
              qtd_alunos_texto = 'Trios';
              break;
            default:
              qtd_alunos_texto = `${qtd_participantes} Alunos`;
          }

          datatable.row.add([
            nome,
            qtd_aulas_semana + ' Aulas por Semana',
            qtd_alunos_texto,
            'R$ ' + valor,
            status,
            acoes
          ]);
        });

        datatable.draw();

        $('.btn-edit').click(function () {
          const planId = $(this).data('id');
          openEditModal(planId);
        });
      })
      .catch(handleError);
  };

  /**
   * Valida o formulário antes de gravar os dados do usuário.
   * @param {Array} formsData - Um array contendo os elementos do formulário.
   */
  const validateForm = (formsData,) => {
    if (formsData.some(element => element.val().trim() === '')) {
      alertError.text('Todos os campos devem ser preenchidos.').show();
      return false;
    }

    return true;
  };

  /**
   * Puxa os dados do pacote através da ID existente no backend para edição.
   * @param {number} planId - O ID do pacote a ser editado.
   */
  const openEditModal = (planId) => {
    modal.find('.modal-title').text(`Editando pacote #${planId}`);

    normal_request(`/backend/pacotes/ver/${planId}`, {}, 'GET', csrftoken)
      .then(response => {
        const dados = response.dados;

        input_nome.val(dados.nome);
        input_valor.val(dados.valor);
        select_qtd_aulas_semana.val(dados.qtd_aulas_semana).trigger("change");
        select_qtd_participantes.val(dados.qtd_participantes).trigger("change");

        btnGravar.val(dados.id);
        modal.modal("show");

        input_valor.mask("###0,00", { reverse: true });
      })
      .catch(handleError);
  };

  /**
   * Abre o modal de remoção do pacote através da ID existente no backend.
   * @param {number} planId - O ID do pacote a ser deletado.
   */
  const openDeleteModal = (planId) => {
    // Primeiro verifica se o pacote tem contratos ativos
    normal_request(`/backend/pacotes/${planId}/contratos/buscar`, {}, 'GET', csrftoken)
      .then(response => {
        const contratosAtivos = response.dados.some(contrato => contrato.ativo === 'S');
        const historicoExistente = response.historico && response.historico.length > 0;

        if (contratosAtivos || historicoExistente) {
          // Se tem contrato ativo, mostra uma mensagem de erro
          alertavel.find('.modal-body').html("O pacote não pode ser excluído pois possui contratos ativos ou histórico de contratos.");
          alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
          alertavel.modal("show");
        } else {
          // Se não tem contrato ativo, mostra o modal de confirmação de exclusão
          alertavel.find('.modal-body').html("Tem certeza que deseja deletar o pacote?");
          alertavel.find('.modal-footer').html(`<button class="btn confirm-delete" data-plan-id="${planId}">Deletar</button>`);
          alertavel.modal("show");

          $(".confirm-delete").off("click").click(function () {
            const id = $(this).attr("data-plan-id");
            normal_request(`/backend/pacotes/deletar/${id}`, {}, 'DELETE', csrftoken)
              .then(response => {
                const successMessage = response.msg || '';
                if (successMessage.includes('O registro foi deletado com sucesso!')) {
                  alertavel.find('.modal-body').html(`O registro foi deletado com sucesso!`);
                  alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
                  carregar_dados();
                } else {
                  console.error('Erro ao deletar pacote:', response.message);
                }
                alertavel.modal("show");
              })
              .catch(handleError);
          });
        }
      })
      .catch(handleError);
  };

  /**
   * Grava os dados do novo pacote no backend.
   */
  const gravarFormPlan = () => {
    const formsData = [input_nome, input_valor, select_qtd_aulas_semana, select_qtd_participantes];

    alertError.hide();
    if (validateForm(formsData)) {
      normal_request('/backend/pacotes/criar', {
        nome: input_nome.val(),
        valor: input_valor.val().replace(',', '.'),
        qtd_aulas_semana: select_qtd_aulas_semana.val(),
        qtd_participantes: select_qtd_participantes.val(),
        ativo: 'S'
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
   * Edita os dados de um pacote existente no backend.
   * @param {number} planId - O ID do pacote a ser editado.
   */
  const editarFormPlan = (planId) => {
    const formsData = [input_nome, input_valor, select_qtd_aulas_semana, select_qtd_participantes];
    if (validateForm(formsData)) {

      normal_request(`/backend/pacotes/atualizar/${planId}`, {
        nome: input_nome.val(),
        valor: input_valor.val().replace(',', '.'),
        qtd_aulas_semana: select_qtd_aulas_semana.val(),
        qtd_participantes: select_qtd_participantes.val(),
        ativo: 'S'
      }, 'PUT', csrftoken)
        .then(response => {
          if (!response.erro) {
            modal.modal("hide");
            alertavel.find(".modal-body").text("Dados editados com sucesso!");
            alertavel.modal("show");
            carregar_dados();
          } else {
            alertavel.find(".modal-body").text(response.erro);
            alertavel.modal("show");
          }
        }).catch(handleError);
    }
  }

  /**
   * Manipula o clique no botão "Gravar" para adicionar ou editar um pacote.
   * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnGravarClickHandler = (event) => {
    const { value } = event.target;
    value != -1 ? editarFormPlan(value) : gravarFormPlan();
  };

  /**
  * Manipula o clique no botão "Novo Pacote" para abrir o modal de criação de pacotes.
  * @param {Event} event - O objeto de evento associado ao clique no botão.
  */
  const btnNewPlanClickHandler = (event) => {
    event.preventDefault();

    modal.find('input, select').val('');
    modal.find('.modal-title').text('Criação de pacotes');

    btnGravar.val("-1");
    select_qtd_aulas_semana.val('-1').trigger("change");
    select_qtd_participantes.val('-1').trigger("change");

    modal.modal("show");
  };

  /**
   * Altera o status (ativo/inativo) de um usuário.
   * @param {number} planId - O ID do usuário cujo status será alterado.
   * @param {boolean} activate - Define se o usuário deve ser ativado (true) ou desativado (false).
  */
  const changeStatus = (planId, activate) => {
    const endpoint = `/backend/pacotes/ativar_desativar/${planId}`;
    const token = csrftoken;
    const requestData = { ativar: activate ? 'S' : 'N' };

    normal_request(endpoint, requestData, 'PUT', token)
      .then(response => {
        const successMessage = response.msg || '';

        if (successMessage.includes('Pacote ativado') || successMessage.includes('Pacote desativado')) {
          carregar_dados();
        } else {
          console.error('Erro ao ativar/desativar pacote:', response.msg);
        }
      })
      .catch(handleError);
  };

  datatable.on("click", ".btn-ativo, .btn-inativo", function () {
    const planId = $(this).data("id");
    const activate = !$(this).hasClass("btn-ativo");

    changeStatus(planId, activate);
  });

  datatable.on("click", ".btn-delete", function () {
    const planId = $(this).data("id");
    openDeleteModal(planId);
  });

  alertavel.on("click", ".close-modal", () => {
    alertavel.find('.modal-footer').html(`<button type="button" class="btn btn-back" data-bs-dismiss="modal">Fechar</button>`);
    alertavel.modal("show");
  });

  modal.on("click", ".close-modal", () => {
    modal.modal("hide")
  });

  const btnGravar = $("#Gravar").click(btnGravarClickHandler);
  const btnNewPlan = $("#new_plan").click(btnNewPlanClickHandler);

  carregar_dados();

});
document.addEventListener('DOMContentLoaded', function () {
  const cpf = $('#cpf');
  const form = $("#formulario");
  const btnGravar = $("#Gravar");
  const modal = $("#modal-form");
  const btnNewUser = $("#new_user");
  const datatable = $("#datatable-user");
  const fileImage = document.querySelector('.input-preview__src');
  const filePreview = document.querySelector('.input-preview');

  cpf.mask('000.000.000-00', { reverse: true });
  fileImage.onchange = function () {
    const reader = new FileReader();

    reader.onload = function (e) {
      const { result } = e.target;
      filePreview.style.backgroundImage = `url(${result})`;
      filePreview.classList.add("has-image");
    };

    reader.readAsDataURL(this.files[0]);
  };

  btnNewUser.click(() => {
    modal.modal("show");
  });

  modal.on("click", ".close-modal", function () {
    modal.modal("hide");
  });

  const gravar = (formData) => {
    form_data_request('http://localhost:8000/backend/usuarios/criar', formData, 'POST', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(json => {
        console.log(json);
      })
      .catch(e => {
        console.log(e);
      });
  };

  const load_grupos = () => {
    normal_request('http://localhost:8000/backend/grupos/buscar', {}, 'GET', 'sRpbaf0oo4p5vc4MdIFA9TqRUJIQntws')
      .then(json => {

        console.log(json)

      })
      .catch(obj => console.log(obj))
  }

  btnGravar.click((event) => {
    event.preventDefault(); // Impede o envio padrão do formulário
    const formData = new FormData(form[0]);
    gravar(formData);
  });

  datatable.DataTable();
});

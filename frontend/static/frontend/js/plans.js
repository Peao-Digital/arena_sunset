$(document).ready(function () {

  const modal = $("#alertavel");

  $("#new_plans").click(() => {
    const modalbody = modal.find(".modal-body");
    const modaltitle = modal.find(".modal-title");

    modaltitle.text("Novo Pacote de aula");
    modalbody.text("Texto");
    modal.modal("show");
  })

  modal.on("click", ".close-modal", function () {
    modal.modal("hide");
  });

});
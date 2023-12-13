$(document).ready(() => {
  const sidebar = $('.custom-sidebar');
  const btnToggle = $('.btn-toggle');
  const logo = $('.btn-logo');
  const conteudo = $('#content');
  const navbar = $('#navbar');

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      sidebar.removeClass('show');
      navbar.addClass('navSideClose').removeClass('navSideOpen');
      conteudo.addClass('page-wrapperClose').removeClass('page-wrapper');
      btnToggle.html('<i class="icons fa-solid fa-bars"></i>');
      logo.css('display', 'none');
    } else {
      // Se a tela for maior que 768 pixels, restaura o comportamento padrão
      sidebar.addClass('show');
      navbar.addClass('navSideOpen').removeClass('navSideClose');
      conteudo.addClass('page-wrapper').removeClass('page-wrapperClose');
      btnToggle.html('<i class="icons fa-solid fa-x"></i>');
      logo.css('display', 'block');
    }
  };

  // Chama a função ao carregar a página
  closeSidebarOnMobile();

  // Atualiza a função ao redimensionar a janela
  $(window).resize(closeSidebarOnMobile);

  btnToggle.on('click', () => {
    sidebar.toggleClass('show');
    const isSidebarVisible = sidebar.hasClass('show');

    navbar.toggleClass('navSideClose', !isSidebarVisible).toggleClass('navSideOpen', isSidebarVisible);
    conteudo.toggleClass('page-wrapper', isSidebarVisible).toggleClass('page-wrapperClose', !isSidebarVisible);

    btnToggle.html(`<i class="icons fa-solid ${isSidebarVisible ? 'fa-x' : 'fa-bars'}"></i>`);
    logo.css('display', isSidebarVisible ? 'block' : 'none');
  });
});

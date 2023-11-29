$(document).ready(() => {
  const sidebar = $('.custom-sidebar');
  const btnToggle = $('.btn-toggle');
  const logo = $('.btn-logo');
  const conteudo = $('#content');
  const navbar = $('#navbar');

  const toggleSidebar = () => {
    sidebar.toggleClass('show');
    const isSidebarVisible = sidebar.hasClass('show');

    navbar.toggleClass('navSideClose', !isSidebarVisible).toggleClass('navSideOpen', isSidebarVisible);
    conteudo.toggleClass('page-wrapper', isSidebarVisible).toggleClass('page-wrapperClose', !isSidebarVisible);

    btnToggle.html(`<i class="icons fa-solid ${isSidebarVisible ? 'fa-x' : 'fa-bars'}"></i>`);
    logo.css('display', isSidebarVisible ? 'block' : 'none');
  };

  btnToggle.on('click', toggleSidebar);
});

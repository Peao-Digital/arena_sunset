$(document).ready(function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    buttonText: {
      prevYear: "&nbsp;&lt;&lt;&nbsp;",
      nextYear: "&nbsp;&gt;&gt;&nbsp;",
      today: "Hoje",
      month: "Mês",
      week: "Semana",
      day: "Dia"
    },
    locale: 'pt-br',
    selectable: true,
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    dateClick: function (info) {
      $("#alertavel").modal("show");
    },
    dayMaxEventRows: true, // Adicione essa linha para limitar o número de eventos por linha
    eventTextColor: '#fff', // Defina a cor do texto do evento como branco
    contentHeight: 'auto', // Adicione essa linha para ajustar automaticamente a altura do calendário
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' }, // Adicione essa linha para formatar o horário do evento
    eventDisplay: 'block', // Adicione essa linha para exibir os eventos em blocos
  });



  calendar.render();
});
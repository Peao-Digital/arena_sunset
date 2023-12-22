from datetime import datetime, date, timedelta

def f_usuario_possui_grupo(user, tipo_grupo):
  if user.is_authenticated is False:
    return False
  
  if user.is_superuser:
    return True
  
  return len(user.groups.filter(tipo_grupo__tipo=tipo_grupo)) > 0

def f_nome_usuario(user):
  if user is None:
    return ''
  if user.first_name != '':
    return user.first_name.capitalize() + ' ' + user.last_name
  return user.username.capitalize()

def construir_datahorario(data, horario):
  ano, mes, dia = data.split('-')
  hora, minuto = horario.split(':')

  d = datetime(year=int(ano), month=int(mes), day=int(dia), hour=int(hora), minute=int(minuto), second=0)
  return d

def ajustar_horario(horario):
  return ('00' if horario.hour == 0 else str(horario.hour)) + ':' + ('00' if horario.minute == 0 else str(horario.minute))

def f_gerar_datas_periodo(data_inicial, data_final, dia_semana):
  d1 = data_inicial.split('-')
  d2 = data_final.split('-')

  a1 = date(int(d1[0]),int(d1[1]), int(d1[2]))
  a2 = date(int(d2[0]),int(d2[1]), int(d2[2]))
  delta = timedelta(days=1)

  datas = []
  while a1 <= a2:
    if a1.weekday() == dia_semana:
      datas.append(a1.isoformat())
    a1 += delta

  return datas
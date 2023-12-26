from datetime import datetime, date, timedelta

def f_usuario_possui_grupo(user, tipo_grupo):
  if user.is_authenticated is False:
    return False
  
  return len(user.groups.filter(tipo_grupo__tipo=tipo_grupo)) > 0

def f_nome_usuario(user):
  if user is None:
    return ''
  if user.first_name != '':
    return user.first_name.capitalize() + ' ' + user.last_name
  return user.username.capitalize()

def construir_datahorario(data, horario):
  if data is None:
    return None
  ano, mes, dia = data.split('-')
  hora, minuto = horario.split(':')

  d = datetime(year=int(ano), month=int(mes), day=int(dia), hour=int(hora), minute=int(minuto), second=0)
  return d

def ajustar_horario(horario):
  return ('00' if horario.hour == 0 else str(horario.hour)) + ':' + ('00' if horario.minute == 0 else str(horario.minute))

def f_gerar_datas_periodo(data_inicial, data_final, dia_semana):
  a1 = f_contruir_data(data_inicial)
  a2 = f_contruir_data(data_final)
  delta = timedelta(days=1)

  datas = []
  while a1 <= a2:
    if a1.weekday() == dia_semana:
      datas.append(a1.isoformat())
    a1 += delta

  return datas

def f_contruir_data(data_str):
  d = data_str.split('-')
  return date(int(d[0]),int(d[1]), int(d[2]))
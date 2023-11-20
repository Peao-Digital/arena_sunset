from datetime import datetime
from django.utils.timezone import make_aware

def f_usuario_possui_grupo(user, tipo_grupo):
  if user.is_authenticated is False:
    return False
  
  if user.is_superuser:
    return True
  
  return len(user.groups.filter(tipo_grupo__tipo=tipo_grupo)) > 0

def f_nome_usuario(user):
  if user.first_name != '':
    return user.first_name.capitalize() + ' ' + user.last_name
  return user.username.capitalize()

def conveter_datahorario(data, hora):
  return make_aware(datetime.strptime(data + ' ' + hora, '%Y-%m-%d %H:%M'))
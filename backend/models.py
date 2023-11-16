from django.db import models
from django.contrib.auth.models import (User, Group)

from .constants import *
from .models import *

'''
  Classe Perfil contém os dados adicionais do usuário
'''
class Perfil(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
  cpf = models.CharField(max_length=11, blank=True)
  celular = models.CharField(max_length=30, blank=True)
  foto_perfil = models.CharField(max_length=200, blank=True)
  bio = models.TextField(blank=True)

  def __str__(self):
    return self.user.username

'''
  Classe TipoGrupo contém os dados adicionais do grupo
'''
class TipoGrupo(models.Model):
  grupo = models.OneToOneField(Group, on_delete=models.CASCADE, related_name="tipo_grupo")
  descricao = models.TextField(blank=True)
  tipo = models.CharField(max_length=30, blank=False, choices=Opcoes.TIPO_GRUPO)
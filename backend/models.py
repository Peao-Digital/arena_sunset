from django.db import models
from django.contrib.auth.models import (User, Group)
from django.db.models import Q

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

'''
  Classe de pacote de aulas
'''
class Pacote(models.Model):
  nome = models.TextField()
  valor = models.DecimalField(max_digits=10,decimal_places=2)
  qtd_aulas_semana = models.IntegerField()
  qtd_participantes = models.IntegerField()
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)

'''
  Classe de aluno
'''
class Aluno(models.Model):
  nome = models.CharField(max_length=300)
  cpf = models.CharField(max_length=11, blank=True, null=True)
  celular = models.CharField(max_length=30, blank=True, null=True)
  email = models.CharField(max_length=300, blank=True, null=True)
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)
  sexo = models.CharField(max_length=1, choices=Opcoes.TIPO_SEXO, null=True, blank=True)
  nascimento = models.DateField(null=True, blank=True)

'''
  Classe AlunoPacote
'''
class AlunoPacote(models.Model):
  aluno = models.ForeignKey(Aluno, on_delete=models.DO_NOTHING)
  pacote = models.ForeignKey(Pacote, on_delete=models.DO_NOTHING)
  data_contratacao = models.DateField()
  data_validade = models.DateField()
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)

  class Meta:
    verbose_name_plural = 'Aluno - Pacote'
    unique_together = ('aluno', 'pacote')

'''
  Classe AlunoPacoteHistorico
'''

class AlunoPacoteHistorico(models.Model):
  aluno_pacote = models.ForeignKey(AlunoPacote, on_delete=models.DO_NOTHING)
  criado_em = models.DateTimeField(auto_now_add=True, editable=False)
  desativado_em = models.DateField(blank=True, null=True)
  desativado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True)
  data_contratacao = models.DateField()
  data_validade = models.DateField()

  class Meta:
    verbose_name_plural = 'Aluno - Pacote | Histórico'

'''
  Classe de aula
'''
class Aula(models.Model):
  professor = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aula_professor')

  criado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aula_criado_por')
  atualizado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aula_atualizado_por',null=True, blank=True)

  criado_em = models.DateTimeField(auto_now_add=True, editable=False)
  atualizado_em = models.DateTimeField(auto_now=True, editable=False)

'''
  Classe AulaParticipante 
'''
class AulaParticipante(models.Model):
  aula = models.ForeignKey(Aula, on_delete=models.DO_NOTHING)
  pacote = models.ForeignKey(Pacote, on_delete=models.DO_NOTHING, null=True, blank=True)
  contratante = models.ForeignKey(Aluno, on_delete=models.DO_NOTHING, related_name='aula_contratante')
  participante = models.ForeignKey(Aluno, on_delete=models.DO_NOTHING, related_name='aula_participante')

  conferido = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)
  conferido_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aulaaluno_conferido_por', null=True, blank=True)
  conferido_em = models.DateTimeField(null=True, blank=True)

'''
  Classe DiaReservado 
'''
class DiaReservado(models.Model):
  descricao = models.TextField(blank=True)

  class Meta:
    verbose_name_plural = 'Dias de reserva especiais'

'''
  Classe Recorrencia
'''
class Recorrencia(models.Model):
  aula = models.ForeignKey(Aula, on_delete=models.CASCADE, null=True, blank=True)
  dia_semana = models.IntegerField(null=True, blank=True)
  horario_ini = models.CharField(max_length=5)
  horario_fim = models.CharField(max_length=5)
  dia_inteiro = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)

  class Meta:
    verbose_name_plural = "Recorrencia de aulas"
  
'''
  Classe Reserva
'''
class Reserva(models.Model):
  data = models.DateField(null=True, blank=True)
  data_horario_ini = models.DateTimeField(null=True, blank=True)
  data_horario_fim = models.DateTimeField(null=True, blank=True)
  dia_inteiro = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)
  
  aula_unica = models.ForeignKey(Aula, on_delete=models.CASCADE, null=True, blank=True)
  especial = models.ForeignKey(DiaReservado, on_delete=models.CASCADE, null=True, blank=True)

  cancelado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True)
  cancelado_em = models.DateTimeField(null=True, blank=True)
  motivo_cancelamento = models.TextField(blank=True, null=True)

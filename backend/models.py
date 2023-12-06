from django.db import models
from django.contrib.auth.models import (User, Group)
from django.db.models import Q

from backend.functions import conveter_datahorario

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
  cpf = models.CharField(max_length=11, blank=True)
  celular = models.CharField(max_length=30, blank=True)
  email = models.CharField(max_length=300, blank=True)
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)

'''
  Classe AlunoPacote
'''
class AlunoPacote(models.Model):
  aluno = models.ForeignKey(Aluno, on_delete=models.DO_NOTHING)
  pacote = models.ForeignKey(Pacote, on_delete=models.DO_NOTHING)
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)
  criado_em = models.DateTimeField(auto_now_add=True, editable=False)
  desativado_em = models.DateField(blank=True, null=True)
  desativado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True)
  data_contratacao = models.DateField()
  data_validade = models.DateField()

  class Meta:
    verbose_name_plural = 'Aluno - Pacote'

'''
  Classe de aula
'''
class Aula(models.Model):
  pacote = models.ForeignKey(Pacote, on_delete=models.DO_NOTHING)
  contratante = models.ForeignKey(Aluno, on_delete=models.DO_NOTHING, related_name='aula_contratante')
  professor = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aula_professor')
  ativa = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)

  criado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aula_criado_por')
  atualizado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aula_atualizado_por',null=True, blank=True)

  criado_em = models.DateTimeField(auto_now_add=True, editable=False)
  atualizado_em = models.DateTimeField(auto_now=True, editable=False)

  cancelado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='aula_cancelado_por', null=True, blank=True)
  cancelado_em = models.DateTimeField(null=True, blank=True)
  motivo_cancelamento = models.TextField(blank=True, null=True)

  def pode_cadastrar(self):
    pass

'''
  Classe de Aula - Aluno
'''
class AulaAluno(models.Model):
  aula = models.ForeignKey(Aula, on_delete=models.CASCADE)
  aluno = models.ForeignKey(Aluno, on_delete=models.DO_NOTHING)
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
  Classe Agenda 
'''
class Agenda(models.Model):
  data = models.DateField()
  data_horario_ini = models.DateTimeField()
  data_horario_fim = models.DateTimeField()

  aula = models.ForeignKey(Aula, on_delete=models.CASCADE, null=True, blank=True)
  reserva_especial = models.ForeignKey(DiaReservado, on_delete=models.CASCADE, null=True, blank=True)
  dia_inteiro = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO)
  ativo = models.CharField(max_length=1, choices=Opcoes.SIM_NAO_OPCAO, default='S')

  cancelado_por = models.ForeignKey(User, on_delete=models.DO_NOTHING, null=True, blank=True)
  cancelado_em = models.DateTimeField(null=True, blank=True)
  motivo_cancelamento = models.TextField(blank=True, null=True)

  class Meta:
    unique_together = ('data_horario_ini', 'data_horario_fim')
    constraints = [
      models.CheckConstraint(
        name="%(app_label)s_%(class)s_aula_ou_especial",
        check=(
            models.Q(aula__isnull=True, reserva_especial__isnull=False)
            | models.Q(aula__isnull=False, reserva_especial__isnull=True, ativo='S')
        ),
      )
    ]
  
  def existe(self):
    c1 = Agenda.objects.filter(
      data_horario_ini__range=(self.data_horario_ini, self.data_horario_fim), ativo='S'
    ).exists()

    c2 = Agenda.objects.filter(
      data=self.data, dia_inteiro='S'
    ).exists()

    return c1 or c2
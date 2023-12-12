import json
import os
import datetime
from dateutil.relativedelta import relativedelta

from django.core.exceptions import (ValidationError, ObjectDoesNotExist)
from django.db import transaction
from django.db.models import Q
from django.contrib.auth.models import (User, Group)
from django.conf import settings
from django.core.files.storage import FileSystemStorage

from .functions import *

from .models import *

def upload_file(f, name, dirpath):
  try:
    fs = FileSystemStorage(location=dirpath)
    fs.save(name, f)
    return name
  except Exception as e:
    return ''

def ajustar_horario(horario_ini):
  return str(horario_ini.hour) + ':' + str(horario_ini.minute)

class GruposSrv():

  @staticmethod
  def buscar(request):
    try:
      dados = Group.objects.values('id','name', 'tipo_grupo__tipo').all()
      return {'dados': list(dados)}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class UsuarioSrv():

  @staticmethod
  def ver(request, id):
    try:
      u = User.objects.select_related().get(pk=id, is_superuser=False)

      grupos = []
      grupos_id = []

      for grupo in u.groups.all():
        grupos.append(grupo.name)
        grupos_id.append(grupo.id)

      foto = ''
      cpf = ''
      if u.perfil:
        cpf = u.perfil.cpf
        #foto = settings.UPLOAD_URL + 'usuarios/' + u.perfil.foto_perfil


      d_json = {
        'id': u.id,
        'usuario': u.username,
        'nome': u.first_name,
        'sobrenome': u.last_name,
        'email': u.email,
        'ativo': u.is_active,
        'foto': foto,
        'grupos': grupos,
        'grupos_id': grupos_id,
        'cpf': cpf
      }

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar(request):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        usuario = post_data.get('usuario', None)
        senha = post_data.get('senha', None)
        nome = post_data.get('nome', '')
        sobrenome = post_data.get('sobrenome', '')
        email = post_data.get('email', '')
        cpf = post_data.get('cpf', '')
        grupo = post_data.get('grupo', None)

        if len(User.objects.filter(username=usuario)):
          return {"erro": "Uma conta com este mesmo usuário ({}) ja existe!".format(usuario), "tipo_erro": "validacao"}, 400
        
        if len(Perfil.objects.filter(cpf=cpf)) and cpf != '':
          return {"erro": "Uma conta com este mesmo cpf ({}) ja existe!".format(cpf), "tipo_erro": "validacao"}, 400
        
        u_obj = User()
        u_obj.username = usuario
        u_obj.first_name = nome
        u_obj.last_name = sobrenome
        u_obj.email = email
        u_obj.username = usuario
        u_obj.set_password(senha)

        u_obj.save()

        #arquivo = ''
        #if request.FILES.get('foto', None) is not None:
        #  extensao = request.FILES['foto'].name.split('.')[-1]
        #  nome = 'foto_perfil_{}.{}'.format(u_obj.id, extensao)
        #  dirpath = os.path.join(settings.UPLOAD_ROOT, 'usuarios')
        #  arquivo = upload_file(request.FILES['foto'], nome, dirpath)

        p_obj = Perfil()
        p_obj.user = u_obj
        p_obj.cpf = cpf
        #p_obj.foto_perfil = arquivo

        p_obj.save()
        
        if grupo is not None:
          Group.objects.get(pk=grupo)
          u_obj.groups.add(grupo)

      return {'id': u_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def atualizar(request, id):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        usuario = post_data.get('usuario', None)
        senha = post_data.get('senha', None)
        nome = post_data.get('nome', '')
        sobrenome = post_data.get('sobrenome', '')
        email = post_data.get('email', '')
        grupo = post_data.get('grupo', None)
        cpf = post_data.get('cpf', '')

        if len(User.objects.filter(~Q(pk=id), username=usuario)):
          return {"erro": "Uma conta com este mesmo usuário ({}) ja existe!".format(usuario), "tipo_erro": "validacao"}, 400
        
        if len(Perfil.objects.filter(~Q(user__id=id), cpf=cpf)) and cpf != '':
          return {"erro": "Uma conta com este mesmo cpf ({}) ja existe!".format(cpf), "tipo_erro": "validacao"}, 400
        
        u_obj = User.objects.get(pk=id)
        u_obj.username = usuario
        u_obj.first_name = nome
        u_obj.last_name = sobrenome
        u_obj.email = email
        u_obj.username = usuario
        
        if senha != '':
          u_obj.set_password(senha)

        u_obj.save()

        p_obj = Perfil.objects.filter(user=u_obj)
        if len(p_obj):
          p_obj = p_obj.first()
        else:
          p_obj = Perfil()
          p_obj.user = u_obj
        p_obj.cpf = cpf
        p_obj.save()

        u_obj.groups.clear()
        if grupo is not None:
          Group.objects.get(pk=grupo)
          u_obj.groups.add(grupo)
      return {'id': u_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def atualizar_foto(request, id):
    pass

  @staticmethod
  def deletar_foto(request, id):
    try:
      perfil = Perfil.objects.get(user=User.objects.get(pk=id))

      if perfil.foto_perfil != '':
        os.remove(os.path.join(settings.UPLOAD_ROOT, 'usuarios', perfil.foto_perfil))

      perfil.foto_perfil = ''
      perfil.save()
      return {'msg': 'Foto deletada!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def ativar_desativar(request, id):
    try:
      
      u = User.objects.get(pk=id)
      if u.is_active:
        u.is_active = False
        msg = 'Usuário desativado!'
      else:
        u.is_active = True
        msg = 'Usuário ativado!'
      
      u.save(update_fields=['is_active'])
      
      return {'msg': msg}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def deletar(request, id):
    try:
      with transaction.atomic():
        u_obj = User.objects.get(pk=id)
        u_obj.delete()
      return {'msg': 'Usuário deletado!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
  
  @staticmethod
  def buscar(request):
    try:
      nome = request.GET.get('nome', '')

      dados = User.objects.select_related().filter(
        Q(username__icontains=nome) | Q(first_name__icontains=nome) | Q(last_name__icontains=nome),
        is_superuser=False
      )

      d_json = []
      for d in dados:
        grupos = []
        grupos_id = []

        cpf = ''
        if d.perfil:
          cpf = d.perfil.cpf

        for grupo in d.groups.all():
          grupos.append(grupo.name)
          grupos_id.append(grupo.id)

        d_json.append({
          'id': d.id,
          'cpf': cpf,
          'usuario': d.username,
          'nome': d.first_name,
          'sobrenome': d.last_name,
          'email': d.email,
          'ativo': d.is_active,
          'grupos': grupos,
          'grupos_id': grupos_id
        })

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def trocar_senha(request):
    try:

      post_data = json.loads(request.body)
      senha = post_data.get('senha', None)

      request.user.set_password(senha)
      request.user.save()

      return {'msg': 'A senha foi trocada com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class ProfessorSrv():
  
  @staticmethod
  def listar(request):
    try:

      if f_usuario_possui_grupo(request.user, 'PROFESSOR') and request.user.is_superuser is False:
        dados = User.objects.select_related().filter(pk=request.user.id)
      else:
        dados = User.objects.select_related().filter(groups__tipo_grupo__tipo='PROFESSOR')

      d_json = []
      for dado in dados:
        d_json.append({
          'id': dado.id, 'usuario': dado.username,
          'nome': f_nome_usuario(dado)
        })

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def ver_horarios(request, id):
    pass

class PacoteSrv():

  @staticmethod
  def listar(request):
    try:
      dados = Pacote.objects.values('id', 'nome', 'qtd_aulas_semana', 'qtd_participantes', 'valor', 'ativo').all()
      return {'dados': list(dados)}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def ver(request, id):
    try:
      dados = Pacote.objects.values('id', 'nome', 'qtd_aulas_semana', 'qtd_participantes', 'valor', 'ativo').get(pk=id)
      return {'dados': dados}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
  
  @staticmethod
  def ativar_desativar(request, id):
    try:
      pacote = Pacote.objects.get(pk=id)

      if pacote.ativo == 'N':
          pacote.ativo = 'S'
          msg = 'Pacote ativado!'
      else:
          pacote.ativo = 'N'
          msg = 'Pacote desativado!'
      
      pacote.save(update_fields=['ativo'])
      
      return {'msg': msg}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar(request):
    try:
      post_data = json.loads(request.body)

      pacote_obj = Pacote()
      pacote_obj.nome = post_data.get('nome', None)
      pacote_obj.valor = post_data.get('valor', None)
      pacote_obj.qtd_aulas_semana = post_data.get('qtd_aulas_semana', None)
      pacote_obj.qtd_participantes = post_data.get('qtd_participantes', None)
      pacote_obj.ativo = post_data.get('ativo', None)

      pacote_obj.full_clean()
      pacote_obj.save()
      
      return {'id': pacote_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
    
  @staticmethod
  def atualizar(request, id):
    try:
      post_data = json.loads(request.body)
      pacote_obj = Pacote.objects.get(pk=id)
      pacote_obj.nome = post_data.get('nome', None)
      pacote_obj.valor = post_data.get('valor', None)
      pacote_obj.qtd_aulas_semana = post_data.get('qtd_aulas_semana', None)
      pacote_obj.qtd_participantes = post_data.get('qtd_participantes', None)
      pacote_obj.ativo = post_data.get('ativo', None)

      pacote_obj.full_clean()
      pacote_obj.save()
      
      return {'id': pacote_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
    
  @staticmethod
  def deletar(request, id):
    try:
      pacote_obj = Pacote.objects.get(pk=id)
      pacote_obj.delete()

      return {'msg': 'O registro foi deletado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class AlunoSrv():
  
  @staticmethod
  def ver(request, id):
    try:
      dados = Aluno.objects.values('id', 'nome', 'cpf', 'celular', 'email', 'ativo').get(pk=id)

      return {'dados': dados}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def buscar(request):
    try:
      dados = Aluno.objects.values('id', 'nome', 'cpf', 'celular', 'email', 'ativo').all()

      d_json = []
      for dado in dados:
        d_json.append(dado)

      return {'dados': d_json}, 200
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar(request):
    try:
      post_data = json.loads(request.body)
      obj = Aluno()
      obj.nome = post_data.get('nome', None)
      obj.cpf = post_data.get('cpf', '')
      obj.celular = post_data.get('celular', '')
      obj.email = post_data.get('email', '')
      obj.ativo = post_data.get('ativo', None)

      obj.full_clean()
      obj.save()

      return {'id': obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  def ativar_desativar(request, id):
    try:
      aluno = Aluno.objects.get(pk=id)

      if aluno.ativo == 'N':
          aluno.ativo = 'S'
          msg = 'Aluno ativado!'
      else:
          aluno.ativo = 'N'
          msg = 'Aluno desativado!'
      
      aluno.save(update_fields=['ativo'])
      
      return {'msg': msg}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def atualizar(request, id):
    try:
      post_data = json.loads(request.body)
      obj = Aluno.objects.get(pk=id)
      obj.nome = post_data.get('nome', None)
      obj.cpf = post_data.get('cpf', '')
      obj.celular = post_data.get('celular', '')
      obj.email = post_data.get('email', '')
      obj.ativo = post_data.get('ativo', None)

      obj.full_clean()
      obj.save()

      return {'id': obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def deletar(request, id):
    try:
      obj = Aluno.objects.get(pk=id)
      obj.delete()

      return {'msg': 'O registro foi deletado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class PacoteAlunoSrv():
  @staticmethod
  def buscar_por_aluno(request, id):
    try:
      dados = AlunoPacote.objects.values(
        'id', 'aluno', 'aluno__nome', 'pacote','pacote__nome', 'pacote__qtd_aulas_semana', 'pacote__qtd_participantes', 'ativo',
        'data_contratacao', 'data_validade', 'desativado_em', 'desativado_por'
      ).filter(aluno=Aluno.objects.get(pk=id))

      d_json = []
      for dado in dados:
        d_json.append(dado)

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def buscar_por_pacote(request, id):
    try:
      dados = AlunoPacote.objects.values(
        'id', 'aluno', 'aluno__nome', 'pacote', 'pacote__qtd_aulas_semana', 'pacote__qtd_participantes', 'ativo',
        'data_contratacao', 'data_validade'
      ).filter(pacote=Pacote.objects.get(pk=id))

      d_json = []
      for dado in dados:
        d_json.append(dado)

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar(request, id):
    try:
      post_data = json.loads(request.body)

      data_inicio = post_data.get('data_contratacao', None)

      obj = AlunoPacote()
      obj.pacote = Pacote.objects.get(pk=id)
      obj.ativo = post_data.get('ativo', None)
      obj.aluno = Aluno.objects.get(pk=post_data.get('aluno', None))
      obj.data_contratacao = data_inicio
      obj.data_validade = datetime.strptime(data_inicio, '%Y-%m-%d').date() + relativedelta(months=1)
      
      obj.full_clean()
      obj.save()

      return {'id': obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def cancelar(request, id):
    try:
      obj = AlunoPacote.objects.get(pk=id)
      obj.ativo = 'N'
      obj.desativado_em = datetime.now().date()
      obj.desativado_por = request.user

      obj.save()

      return {'msg': 'Contrato cancelado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  def pode_reservar(pacote, contratante, data):
    contratacao = AlunoPacote.objects.filter(ativo='S', aluno = contratante, data_contratacao__gte=data, data_validade__lte=data)

    if contratacao.exists():
      qtd = len(Agenda.objects.filter(
        aula__contratante=contratante, aula__pacote=pacote, data__range=(contratacao.data_contratacao, contratacao.data_validade))
      )
      return pacote.qtd_aulas_semana > qtd
    
    return False
class AgendaSrv():

  @staticmethod
  def buscar_reservas(request):
    try:
      data_inicial = request.GET.get('data_inicial', None)
      data_final = request.GET.get('data_final', None)

      if data_inicial is None:
        dados = Agenda.objects.filter(ativo='S')
      else:
        dados = Agenda.objects.filter(data__range=(data_inicial, data_final), ativo='S')

      d_json = []
      for dado in dados:
        alunos = []
        contratante = ''
        professor = ''
        tipo = ''
        
        if dado.aula is not None:
          tipo = 'AULA'
          professor = {'id': dado.aula.professor.id, 'nome': f_nome_usuario(dado.aula.professor)}
          contratante = {'id': dado.aula.contratante.id, 'nome': dado.aula.contratante.nome}

          alunosQuery = AulaAluno.objects.select_related().filter(aula = dado.aula)
          alunos = [
            {'id': d.aluno.id, 'nome': d.aluno.nome} for d in alunosQuery
          ]
        else:
          tipo = 'ESPECIAL'
          descricao = dado.reserva_especial.descricao

        d_json.append({
          'id': dado.id,
          'data': dado.data,
          'horario_inicial': ajustar_horario(dado.data_horario_ini),
          'horario_final': ajustar_horario(dado.data_horario_fim),
          'dia_inteiro': dado.dia_inteiro,
          'tipo': tipo,
          'descricao': descricao,
          'professor': professor,
          'contratante': contratante,
          'alunos': alunos
        })

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
  
  '''
    -----------Reservar dias/horarios que não podem ser agendados (feriados, torneios, etc...)-----------
  '''
  @staticmethod
  def ver_reserva_especial(request, id):
    try:

      agenda = Agenda.objects.select_related().get(pk=id)

      d_json = {
        'agenda_id': agenda.id,
        'descricao': agenda.reserva_especial.descricao,
        'data': agenda.data,
        'horario_inicial': ajustar_horario(agenda.data_horario_ini),
        'horario_final': ajustar_horario(agenda.data_horario_fim),
        'dia_inteiro': agenda.dia_inteiro,
        'ativo': agenda.ativo,
        'cancelado_por': agenda.cancelado_por,
        'cancelado_em': agenda.cancelado_em,
        'motivo_cancelamento': agenda.motivo_cancelamento
      }

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar_reserva_especial(request):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        data = post_data.get('data', None)
        hora_ini = post_data.get('hora_ini', '00:00')
        hora_fim = post_data.get('hora_fim', '23:59')

        obj_r = DiaReservado()
        obj_r.descricao = post_data.get('descricao', '')
        obj_r.dia_inteiro = post_data.get('dia_inteiro', None)

        obj_a = Agenda()
        obj_a.data = data
        obj_a.data_horario_ini = conveter_datahorario(data, hora_ini)
        obj_a.data_horario_fim = conveter_datahorario(data, hora_fim)
        obj_a.reserva_especial = obj_r

        if obj_a.existe() is False:
          obj_r.full_clean()
          obj_r.save()

          obj_r.full_clean()
          obj_a.save()
        else:
          return {'msg': 'Um registro com esta data/horário já existe!'}, 400
      
      return {'id': obj_r.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def deletar_reserva_especial(request, id):
    try:
      with transaction.atomic():
        obj_r = DiaReservado.objects.filter(pk=id)
        obj_a = Agenda.objects.filter(reserva_especial=obj_r)

        obj_a.delete()
        obj_r.delete()
        
      return {'msg': 'Registro deletado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  '''
    -----------Reservas normais-----------
  '''

  @staticmethod
  def criar_reserva_normal(request):
    try:

      def salvar_aulaAluno(aula, aluno):
        obj_aulaAluno = AulaAluno()
        obj_aulaAluno.aula = aula
        obj_aulaAluno.conferido = 'N'
        obj_aulaAluno.aluno = aluno
        obj_aulaAluno.save()

      post_data = json.loads(request.body)
      with transaction.atomic():
        data = post_data.get('data', None)
        horarios = post_data.get('horarios', [])
        alunos = post_data.get('alunos', [])
        participantes = post_data.get('participantes', [])
        professor = User.objects.get(pk=post_data.get('professor', None))
        contratante = Aluno.objects.get(pk=post_data.get('contratante', None))
        pacote = Pacote.objects.get(pk=post_data.get('pacote', None))

        if PacoteAlunoSrv.pode_reservar(pacote, contratante, data) is False:
          return {"erro": "O usuário não possui mais reservas para o período no pacote selecionado!", "e": str(e), "tipo_erro": "validacao"}, 400

        for horario in horarios:
          obj_r = Aula()
          obj_r.pacote = pacote
          obj_r.contratante = contratante
          obj_r.professor = professor
          obj_r.ativa = 'S'
          obj_r.criado_por = request.user

          obj_a = Agenda()
          obj_a.data = data
          obj_a.data_horario_ini = conveter_datahorario(data, horario[0])
          obj_a.data_horario_fim = conveter_datahorario(data, horario[1])
          obj_a.aula = obj_r

          if obj_a.existe() is False:
            professor_bloqueado = obj_a.professor_horario_bloqueado(professor)
            if professor_bloqueado:
              return {'msg': 'O professor selecionado ja possui um agendamente neste horário!'}, 400
            else:
              obj_r.full_clean()
              obj_r.save()

              for aluno in alunos:
                salvar_aulaAluno(obj_r, Aluno.objects.get(pk=aluno))

              for participante in participantes:
                obj_p = Aluno()
                obj_p.nome = participante[0]
                obj_p.telefone = participante[1]
                obj_p.save()

                salvar_aulaAluno(obj_r, obj_p)

              obj_r.full_clean()
              obj_a.save()
          else:
            return {'msg': 'Um registro com esta data/horário já existe!'}, 400
      
      return {'msg': 'Registro gravado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def ver_reserva_normal(request, id):
    try:

      agenda = Agenda.objects.select_related().get(pk=id)

      alunosQuery = AulaAluno.objects.select_related().filter(aula = agenda.aula)
      alunos = [
        {'id': d.aluno.id, 'nome': d.aluno.nome} for d in alunosQuery
      ]

      d_json = {
        'agenda_id': agenda.id,
        'data': agenda.data,
        'horario_inicial': ajustar_horario(agenda.data_horario_ini),
        'horario_final': ajustar_horario(agenda.data_horario_fim),
        'dia_inteiro': agenda.dia_inteiro,
        'ativo': agenda.ativo,
        'cancelado_por': agenda.cancelado_por,
        'cancelado_em': agenda.cancelado_em,
        'motivo_cancelamento': agenda.motivo_cancelamento,
        'professor': {'id': agenda.aula.professor.id, 'nome': f_nome_usuario(agenda.aula.professor)},
        'contratante': {'id': agenda.aula.contratante.id, 'nome': agenda.aula.contratante.nome},
        'alunos': alunos,
      }

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
  
  @staticmethod
  def atualizar_reserva_normal(request, id):
    try:

      def salvar_aulaAluno(aula, aluno):
        obj_aulaAluno = AulaAluno()
        obj_aulaAluno.aula = aula
        obj_aulaAluno.conferido = 'N'
        obj_aulaAluno.aluno = aluno
        obj_aulaAluno.save()

      post_data = json.loads(request.body)
      with transaction.atomic():
        data = post_data.get('data', None)
        horarios = post_data.get('horarios', [])
        alunos = post_data.get('alunos', [])
        participantes = post_data.get('participantes', [])
        professor = User.objects.get(pk=post_data.get('professor', None))
        contratante = Aluno.objects.get(pk=post_data.get('contratante', None))
        pacote = Pacote.objects.get(pk=post_data.get('pacote', None))

        if PacoteAlunoSrv.pode_reservar(pacote, contratante, data) is False:
          return {"erro": "O usuário não possui mais reservas para o período no pacote selecionado!", "e": str(e), "tipo_erro": "validacao"}, 400

        horario = horarios[0]

        obj_r = Aula.objects.get(pk=id)
        obj_r.pacote = pacote
        obj_r.contratante = contratante
        obj_r.professor = professor
        obj_r.ativa = 'S'
        obj_r.criado_por = request.user

        obj_a = obj_r.aula
        obj_a.data = data
        obj_a.data_horario_ini = conveter_datahorario(data, horario[0])
        obj_a.data_horario_fim = conveter_datahorario(data, horario[1])
        obj_a.aula = obj_r

        if obj_a.existe() is False:
            professor_bloqueado = obj_a.professor_horario_bloqueado(professor)
            if professor_bloqueado:
              return {'msg': 'O professor selecionado ja possui um agendamente neste horário!'}, 400
            else:
              obj_r.full_clean()
              obj_r.save()

              AulaAluno.objects.filter(aula=obj_r).delete()

              for aluno in alunos:
                salvar_aulaAluno(obj_r, Aluno.objects.get(pk=aluno))

              for participante in participantes:
                obj_p = Aluno()
                obj_p.nome = participante[0]
                obj_p.telefone = participante[1]
                obj_p.save()

                salvar_aulaAluno(obj_r, obj_p)

              obj_r.full_clean()
              obj_a.save()
        else:
          return {'msg': 'Um registro com esta data/horário já existe!'}, 400
    
      return {'msg': 'Registro gravado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def cancelar_reserva_normal(request, id):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        agenda_obj = Agenda.objects.get(pk=id)

        agenda_obj.ativo = 'N'
        agenda_obj.cancelado_por = request.user
        agenda_obj.cancelado_em = datetime.now().date()
        agenda_obj.motivo_cancelamento = post_data.get('motivo', '')

      return {'msg': 'Reserva cancelada!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
  
  @staticmethod
  def ver_lista_presenca(request, id):
    try:

      agenda = Agenda.objects.filter(pk=id)
      dados = AulaAluno.objects.select_related().get(aula=agenda.aula)

      d_json = []
      for dado in dados:
        d_json.append({
          'id': dado.aluno.id,
          'nome': dado.aluno.nome,
          'conferido': dado.aluno.conferido
        })

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def confirmar_alunos(request, id):
    try:
      post_data = json.loads(request.body)
      with transaction.atomic():
        alunos = post_data.get('alunos', [])
        agenda = Agenda.objects.filter(pk=id)

        for aluno in alunos:
          aluno_obj = Aluno.objects.get(pk=aluno)
          aulaAluno_obj = AulaAluno.objects.get(aula=agenda.aula, aluno=aluno_obj)
          aulaAluno_obj.conferido = 'S'
          aulaAluno_obj.conferido_por = request.user
          aulaAluno_obj.conferido_em = datetime.now().date()

      return {'msg': 'Participações confirmadas!!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
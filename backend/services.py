import json
import os
from datetime import datetime, timedelta
import calendar

from django.conf import settings
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
      dados = Aluno.objects.values('id', 'nome', 'cpf', 'celular', 'email', 'ativo', 'nascimento', 'sexo').get(pk=id)

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
      dados = Aluno.objects.values('id', 'nome', 'cpf', 'celular', 'email', 'ativo', 'nascimento', 'sexo').all()

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
      obj.sexo = post_data.get('sexo', 'N')
      obj.nascimento = post_data.get('nascimento', None)
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
      obj.sexo = post_data.get('sexo', 'N')
      obj.nascimento = post_data.get('nascimento', None)
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
      historicos = AlunoPacoteHistorico.objects.values(
        'aluno_pacote__aluno__id', 'aluno_pacote__aluno__nome', 
        'aluno_pacote__pacote__id', 'aluno_pacote__pacote__nome', 
        'aluno_pacote__pacote__qtd_aulas_semana', 
        'aluno_pacote__pacote__qtd_participantes',
        'aluno_pacote__ativo',
        'data_contratacao', 'data_validade', 'desativado_em'
      ).filter(aluno_pacote__aluno=Aluno.objects.get(pk=id))
      
      dados = AlunoPacote.objects.values(
        'id', 'aluno','aluno__nome', 'pacote__id', 'pacote__nome', 'pacote__qtd_aulas_semana', 'pacote__qtd_participantes', 'ativo', 'data_contratacao', 'data_validade'
      ).filter(aluno=Aluno.objects.get(pk=id), ativo='S').distinct()

      d_historico = []
      for dado in historicos:
        d_historico.append(dado)

      d_json = []
      for dado in dados:
        dado['vencido'] = 'S' if datetime.now().date() > dado['data_validade'] else 'N'
        dado['dias_vencimento'] = (dado['data_validade'] - datetime.now().date()).days
        d_json.append(dado)

      return {'historico': d_historico, 'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def buscar_por_pacote(request, id):
    try:

      historicos = AlunoPacoteHistorico.objects.values(
        'aluno_pacote__aluno__id', 'aluno_pacote__aluno__nome', 
        'aluno_pacote__pacote__id', 'aluno_pacote__pacote__nome', 
        'aluno_pacote__pacote__qtd_aulas_semana', 
        'aluno_pacote__pacote__qtd_participantes',
        'aluno_pacote__ativo',
        'data_contratacao', 'data_validade', 'desativado_em'
      ).filter(aluno_pacote__pacote=Pacote.objects.get(pk=id))
      
      dados = AlunoPacote.objects.values(
        'id', 'aluno','aluno__nome', 'pacote__id', 'pacote__nome', 'pacote__qtd_aulas_semana', 'pacote__qtd_participantes', 'ativo', 'data_contratacao', 'data_validade'
      ).filter(pacote=Pacote.objects.get(pk=id), ativo='S')

      d_historico = []
      for dado in historicos:
        d_historico.append(dado)

      d_json = []
      for dado in dados:
        dado['vencido'] = 'S' if datetime.now().date() > dado['data_validade'] else 'N'
        dado['dias_vencimento'] = (dado['data_validade'] - datetime.now().date()).days
        d_json.append(dado)
      
      return {'historico': d_historico, 'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar(request, id):
    try:

      with transaction.atomic():
        post_data = json.loads(request.body)

        data_inicio = post_data.get('data_contratacao', None)
        dt = data_inicio.split('-')
        ano, mes = dt[0], dt[1]
        dia = calendar.monthrange(int(ano), int(mes))[1]
        aluno = Aluno.objects.get(pk=post_data.get('aluno', None))
        pacote = Pacote.objects.get(pk=id)

        obj = AlunoPacote.objects.filter(pacote=pacote, aluno=aluno)
        if obj.exists():
          obj = obj[0]
        else:
          obj = AlunoPacote()
        obj.pacote = pacote
        obj.ativo = 'S'
        obj.aluno = aluno
        obj.data_contratacao = data_inicio
        obj.data_validade = '{}-{}-{}'.format(ano, mes, dia)

        obj.full_clean()
        obj.save()

        obj_historico = AlunoPacoteHistorico()
        obj_historico.aluno_pacote = obj
        obj_historico.data_contratacao = data_inicio
        obj_historico.data_validade = '{}-{}-{}'.format(ano, mes, dia)
        obj_historico.save()

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

      with transaction.atomic():
        obj = AlunoPacote.objects.get(pk=id)
        obj_historico = AlunoPacoteHistorico.objects.filter(aluno_pacote=obj).order_by('-id')[0]

        obj.ativo = 'N'
        obj_historico.desativado_em = datetime.now().date()
        obj_historico.desativado_por = request.user

        obj.save()
        obj_historico.save()

      return {'msg': 'Contrato cancelado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def pode_reservar(pacote_obj, contratante_obj, data, diasemana):
    if pacote_obj is None:
      return True
    return True

class AgendaSrv():

  @staticmethod
  def salvar_aulaAluno(aula, pacote, contratante, participante):
    obj_aulaAluno = AulaParticipante()
    obj_aulaAluno.conferido = 'N'
    obj_aulaAluno.aula = aula
    obj_aulaAluno.contratante = contratante
    obj_aulaAluno.participante = participante
    obj_aulaAluno.pacote = pacote
    obj_aulaAluno.save()

  @staticmethod
  def horario_disponivel(data, dia_semana, hora_ini, hora_fim, apenas_especial = False):
    return True
    #dth1, dth2 = construir_datahorario(data, hora_ini), construir_datahorario(data, hora_fim)

    ##Conferindo os eventos especiais
    #d1 = Reserva.objects.filter(data=data, especial__isnull=False, dia_inteiro='S', ativo='S')
    #d2 = Reserva.objects.filter(data=data, data_horario_ini__range=(dth1, dth2), especial__isnull=False, dia_inteiro='N', ativo='S')

    #disponivel = d1.exists() is False and d2.exists() is False

    #if apenas_especial is False:
    #  d3 = Reserva.objects.filter(data=data, data_horario_ini__range=(dth1, dth2), aula__isnull=False, ativo='S')
    #  d4 = Recorrencia.objects.filter(horario_ini__range=(dth1, dth2), ativo='S')

    #  disponivel = d1.exists() is False and d2.exists() is False and d3.exists() is False and d4.exists() is False

    #return disponivel

  @staticmethod
  def professor_disponivel(professor, data, dia_semana, hora_ini, hora_fim):
    filtros_recorrencias = {
      'aula__professor': professor,
      'dia_semana': dia_semana,
      'horario_ini': hora_ini,
      'ativo': 'S'
    }

    filtros_reservas = {
      'aula__professor': professor,
      'ativo': 'S'
    }

    if dia_semana is None:
      dia_semana = (f_contruir_data(data)).weekday()
      filtros_recorrencias['dia_semana'] = dia_semana

      dth1, dth2 = construir_datahorario(data, hora_ini), construir_datahorario(data, hora_fim)
      filtros_reservas['data'] = data
      filtros_reservas['data_horario_ini__range'] = (dth1, dth2)

    else:
      filtros_reservas['data__week_day'] = dia_semana
      filtros_reservas['data_horario_ini__hour'] = hora_ini.split(':')[0]

    a1 = Recorrencia.objects.filter(**filtros_recorrencias)
    a2 = Reserva.objects.filter(**filtros_reservas)

    return a1.exists() is False and a2.exists() is False
  
  @staticmethod
  def pode_reservar_pacote_periodo(contratante, pacote, data):
    pass

  @staticmethod
  def buscar_reservas(request):
    try:
      data_inicial = request.GET.get('data_inicial', None)
      data_final = request.GET.get('data_final', None)

      filtros_reservas_especiais = {
        'especial__isnull': False,
        'data__range': (data_inicial, data_final),
        'ativo': 'S'
      }

      filtros_recorrencias = {
        'criado_em__date__lte': data_final,
        'ativo': 'S'
      }

      filtros_reservas_unicas = {
        'aula__isnull': False,
        'data__range': (data_inicial, data_final),
        'ativo': 'S'
      }

      if f_usuario_possui_grupo(request.user, 'PROFESSOR'):
        filtros_recorrencias['aula__professor'] = request.user
        filtros_reservas_unicas['aula__professor'] = request.user

      dados = []
      #Buscando as reservas especiais
      reservas_especiais = Reserva.objects.select_related().filter(**filtros_reservas_especiais)
      for reserva_especial in reservas_especiais:
        dados.append({
          'id': reserva_especial.id,
          'data': reserva_especial.data,
          'horario_ini': ajustar_horario(reserva_especial.data_horario_ini),
          'horario_fim': ajustar_horario(reserva_especial.data_horario_fim),
          'descricao': reserva_especial.especial.descricao,
          'professor': {},
          'dia_semana': '',
          'tipo': 'ESPECIAL'
        })

      #Buscando as reservas com recorrencia
      recorrencias = Recorrencia.objects.select_related().filter(**filtros_recorrencias)
      for recorrencia in recorrencias:

        #Gerando todas as datas possiveis dentro do periodo informado
        lista_datas = f_gerar_datas_periodo(data_inicial, data_final, recorrencia.dia_semana)
        for data in lista_datas:
          dt_obj = f_contruir_data(data)
          if dt_obj >= recorrencia.criado_em.date():
            dados.append({
              'id': recorrencia.id,
              'data': data,
              'horario_ini': recorrencia.horario_ini,
              'horario_fim': recorrencia.horario_fim,
              'descricao': '',
              'professor': {'id': recorrencia.aula.professor.id, 'nome': f_nome_usuario(recorrencia.aula.professor)},
              'dia_semana': recorrencia.dia_semana,
              'tipo': 'NORMAL',
              'criado_em': recorrencia.criado_em.date()
            })

      #Buscando as reservas unicas
      reservas_unicas = Reserva.objects.select_related().filter(**filtros_reservas_unicas)
      for reserva in reservas_unicas:
        dados.append({
          'id': reserva.id,
          'data': reserva.data,
          'horario_ini': ajustar_horario(reserva.data_horario_ini),
          'horario_fim': ajustar_horario(reserva.data_horario_fim),
          'descricao': '',
          'professor': {'id': reserva.aula.professor.id, 'nome': f_nome_usuario(reserva.aula.professor)},
          'dia_semana': '',
          'tipo': 'UNICA'
        })

      return {'dados': dados}, 200
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
      reserva = Reserva.objects.select_related().get(pk=id)

      dados = {
        'id': reserva.id,
        'data': reserva.data,
        'horario_inicial': ajustar_horario(reserva.data_horario_ini),
        'horario_final': ajustar_horario(reserva.data_horario_fim),
        'dia_inteiro': reserva.dia_inteiro,
        'ativo': reserva.ativo,
        'descricao': reserva.especial.descricao,
        'tipo': 'ESPECIAL',
        'pode_editar': f_usuario_possui_grupo(request.user, 'ADM_SITE') or f_usuario_possui_grupo(request.user, 'ATENDIMENTO')
      }
      
      return {'dados': dados}, 200
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

        obj_diaReservado = DiaReservado()
        obj_diaReservado.descricao = post_data.get('descricao', '')
        obj_diaReservado.dia_inteiro = post_data.get('dia_inteiro', None)

        obj_reserva = Reserva()
        obj_reserva.data = data
        obj_reserva.data_horario_ini = construir_datahorario(data, hora_ini)
        obj_reserva.data_horario_fim = construir_datahorario(data, hora_fim)
        obj_reserva.dia_inteiro = post_data.get('dia_inteiro', None)
        obj_reserva.especial = obj_diaReservado
        obj_reserva.ativo = 'S'

        horario_disponivel = AgendaSrv.horario_disponivel(data, None, hora_ini, hora_fim, True)
        if horario_disponivel:
          obj_diaReservado.full_clean()
          obj_diaReservado.save()

          obj_reserva.full_clean()
          obj_reserva.save()
        else:
          return {'msg': 'Um registro com esta data/horário já existe!'}, 400

      return {'id': obj_reserva.id}, 200
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
        obj_reserva = Reserva.objects.get(pk=id)
        obj_diaReservado = obj_reserva.especial

        obj_diaReservado.delete()
        obj_reserva.delete()
      return {'msg': 'Registro deletado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  '''
    -----------Reservas únicas (sem pacote/recorrencia)-----------
  '''

  @staticmethod
  def ver_reserva_unica(request, id):
    try:
      reserva = Reserva.objects.select_related().get(pk=id)

      participantes = AulaParticipante.objects.filter(aula=reserva.aula)
      alunos = [
        {'id': d.participante.id, 'nome': d.participante.nome,
         'contratante_id': d.contratante.id,
         'contratante_nome': d.contratante.nome} for d in participantes
      ]

      pode_editar = f_usuario_possui_grupo(request.user, 'ADM_SITE') or f_usuario_possui_grupo(request.user, 'ATENDIMENTO') or reserva.aula.professor.id == request.user.id

      dados = {
        'id': reserva.id,
        'data': reserva.data,
        'horario_inicial': ajustar_horario(reserva.data_horario_ini),
        'horario_final': ajustar_horario(reserva.data_horario_fim),
        'dia_inteiro': reserva.dia_inteiro,
        'ativo': reserva.ativo,
        'cancelado_por': f_nome_usuario(reserva.cancelado_por),
        'cancelado_em': reserva.cancelado_em,
        'motivo_cancelamento': reserva.motivo_cancelamento,
        'professor': {'id': reserva.aula.professor.id, 'nome': f_nome_usuario(reserva.aula.professor)},
        'alunos': alunos,
        'tipo': 'UNICA',
        'pode_editar': pode_editar
      }

      return {'dados': dados}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar_reserva_unica(request):      
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        data = post_data.get('data', None)
        contratantes = post_data.get('contratantes', None)
        hora_ini = post_data.get('hora_ini', '00:00')
        hora_fim = post_data.get('hora_fim', '23:59')
        dia_inteiro = post_data.get('dia_inteiro', 'N')
        professor_obj = User.objects.get(pk=post_data.get('professor', None))
        contratantes = post_data.get('contratantes', [])

        obj_aula = Aula()
        obj_aula.professor = professor_obj
        obj_aula.criado_por = request.user

        obj_reserva = Reserva()
        obj_reserva.ativo = 'S'
        obj_reserva.data = data
        obj_reserva.data_horario_ini = construir_datahorario(data, hora_ini)
        obj_reserva.data_horario_fim = construir_datahorario(data, hora_fim)
        obj_reserva.dia_inteiro = dia_inteiro
        obj_reserva.aula = obj_aula

        horario_disponivel = AgendaSrv.horario_disponivel(data, None, hora_ini, hora_fim)
        professor_disponivel = AgendaSrv.professor_disponivel(professor_obj, data, None, hora_ini, hora_fim)

        if horario_disponivel and professor_disponivel:
          obj_aula.full_clean()
          obj_aula.save()

          for contratante in contratantes:
            contratante_obj = Aluno.objects.get(pk=contratante['contratante'])
            alunos = contratante['alunos']
            participantes = contratante['participantes']
            pacote_obj = contratante['pacote']

            pacote_obj = Pacote.objects.filter(pk=contratante['pacote'])
            if pacote_obj.exists():
              pacote_obj = pacote_obj[0]
            else:
              pacote_obj = None

            #CONFERIR SE O CONTRATANTE PODE RESERVAR
            if PacoteAlunoSrv.pode_reservar(pacote_obj, contratante_obj, data, None) is False:
              return {"erro": "O usuário não possui mais reservas para o pacote selecionado neste período!", "e": str(e), "tipo_erro": "validacao"}, 400

            for aluno in alunos:
              AgendaSrv.salvar_aulaAluno(obj_aula, pacote_obj, contratante_obj, Aluno.objects.get(pk=aluno))

            for participante in participantes:
              obj_p = Aluno()
              obj_p.nome = participante[0]
              obj_p.celular = participante[1]
              obj_p.ativo = 'S'
              obj_p.save()

              AgendaSrv.salvar_aulaAluno(obj_aula, pacote_obj, contratante_obj, obj_p)

          obj_reserva.full_clean()
          obj_reserva.save()

          return {'id': obj_reserva.id}, 200
        elif horario_disponivel is False:
          return {'msg': 'Um registro com esta data/horário já existe!'}, 400
        else:
          return {'msg': 'O professor selecionado ja possui este horário reservado!'}, 400
        
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def cancelar_reserva_unica(request, id):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        reserva_obj = Reserva.objects.get(pk=id)

        reserva_obj.ativo = 'N'
        reserva_obj.cancelado_por = request.user
        reserva_obj.cancelado_em = datetime.now()
        reserva_obj.motivo_cancelamento = post_data.get('motivo', '')

        reserva_obj.save()

      return {'msg': 'Reserva cancelada!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  '''
    -----------Reservas normais (com pacote/recorrencia)-----------
  '''

  @staticmethod
  def ver_reserva_normal(request, id):
    try:
      recorrencia = Recorrencia.objects.select_related().get(pk=id)

      pode_editar = f_usuario_possui_grupo(request.user, 'ADM_SITE') or f_usuario_possui_grupo(request.user, 'ATENDIMENTO') or recorrencia.aula.professor.id == request.user.id

      participantes = AulaParticipante.objects.filter(aula=recorrencia.aula)
      alunos = [
        {'id': d.participante.id, 'nome': d.participante.nome,
         'contratante_id': d.contratante.id,
         'contratante_nome': d.contratante.nome} for d in participantes
      ]

      dados = {
        'id': recorrencia.id,
        'dia_semana': recorrencia.dia_semana,
        'horario_inicial': recorrencia.horario_ini,
        'horario_final': recorrencia.horario_fim,
        'dia_inteiro': recorrencia.dia_inteiro,
        'ativo': recorrencia.ativo,
        'professor': {'id': recorrencia.aula.professor.id, 'nome': f_nome_usuario(recorrencia.aula.professor)},
        'alunos': alunos,
        'tipo': 'NORMAL',
        'pode_editar': pode_editar
      }

      return {'dados': dados}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar_reserva_normal(request):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        hora_ini = post_data.get('hora_ini', '00:00')
        hora_fim = post_data.get('hora_fim', '23:59')
        professor_obj = User.objects.get(pk=post_data.get('professor', None))
        dia_inteiro = post_data.get('dia_inteiro', 'N')
        dia_semana = post_data.get('dia_semana', None)
        contratantes = post_data.get('contratantes', [])

        obj_aula = Aula()
        obj_aula.professor = professor_obj
        obj_aula.criado_por = request.user

        obj_recorrencia = Recorrencia()
        obj_recorrencia.aula = obj_aula
        obj_recorrencia.ativo = 'S'
        obj_recorrencia.horario_ini = hora_ini
        obj_recorrencia.horario_fim = hora_fim
        obj_recorrencia.dia_semana = dia_semana
        obj_recorrencia.dia_inteiro = dia_inteiro

        horario_disponivel = AgendaSrv.horario_disponivel(None, dia_semana, hora_ini, hora_fim)
        professor_disponivel = AgendaSrv.professor_disponivel(professor_obj, None, dia_semana, hora_ini, hora_fim)

        if horario_disponivel and professor_disponivel:
          obj_aula.full_clean()
          obj_aula.save()

          for contratante in contratantes:
            contratante_obj = Aluno.objects.get(pk=contratante['contratante'])
            alunos = contratante['alunos']
            participantes = contratante['participantes']
            pacote_obj = contratante['pacote']

            pacote_obj = Pacote.objects.filter(pk=contratante['pacote'])
            if pacote_obj.exists():
              pacote_obj = pacote_obj[0]

            #CONFERIR SE O CONTRATANTE PODE RESERVAR
            if PacoteAlunoSrv.pode_reservar(pacote_obj, contratante_obj, None, dia_semana) is False:
              return {"erro": "O usuário não possui mais reservas para o pacote selecionado neste período!", "e": str(e), "tipo_erro": "validacao"}, 400

            for aluno in alunos:
              AgendaSrv.salvar_aulaAluno(obj_aula, pacote_obj, contratante_obj, Aluno.objects.get(pk=aluno))

            for participante in participantes:
              obj_p = Aluno()
              obj_p.nome = participante[0]
              obj_p.celular = participante[1]
              obj_p.ativo = 'S'
              obj_p.save()

              AgendaSrv.salvar_aulaAluno(obj_aula, pacote_obj, contratante_obj, obj_p)

          obj_recorrencia.full_clean()
          obj_recorrencia.save()

          return {'id': obj_recorrencia.id}, 200
        elif horario_disponivel is False:
          return {'msg': 'Um registro com esta data/horário já existe!'}, 400
        else:
          return {'msg': 'O professor selecionado ja possui este horário reservado!'}, 400

    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def cancelar_reserva_normal(request, id):
    try:

      with transaction.atomic():
        reserva_obj = Recorrencia.objects.get(pk=id)
        reserva_obj.ativo = 'N'
        reserva_obj.save()

      return {'msg': 'Reserva cancelada!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class RelatoriosSrv():
  pass

class JobSrv():

  def verificar_vencidos(request):
    try:
      hoje = datetime.now().date()

      #Pegar a data de 'DIAS_INATIVAR_VENCIMENTO' dias atras
      data_limite = hoje - timedelta(days=settings.DIAS_INATIVAR_VENCIMENTO)
      
      #Pegar todas pessoas vencidas a partir do dia atual
      contratantes = AlunoPacote.objects.select_related().filter(ativo='S', data_validade__lte=data_limite)

      contratantes_id = [c.aluno.id for c in contratantes]

      #Buscar as recorrencias com os vencidos
      recorrencias = Recorrencia.objects.select_related().filter(ativo='S', aula__aulaparticipante__contratante__in=contratantes_id)

      #Buscar as reservas com os vencidos
      reservas = Reserva.objects.select_related().filter(ativo='S', aula__aulaparticipante__contratante__in=contratantes_id, data__gte=hoje)

      #Inativar as reservas e recorrencias encontradas
      for recorrencia in recorrencias:
        recorrencia.ativo = 'N'
        recorrencia.save()
      
      for reserva in reservas:
        reserva.ativo = 'N'
        reserva.cancelado_em = datetime.now()
        reserva.motivo_cancelamento = 'Vencimento do pacote do contratante ({} dias atrás).'.format(settings.DIAS_INATIVAR_VENCIMENTO)
        reserva.save()

      return {'msg': 'Dados atualizados!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
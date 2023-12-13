class Opcoes:
  SIM_NAO_OPCAO = [('S', 'SIM'), ('N','NÃO')]
  TIPO_GRUPO = [
    ('ADM_SITE', 'Administração do site'),
    ('PROFESSOR', 'Professor'),
    ('ATENDIMENTO', 'Atendimento'),
    ('ALUNOS', 'Aluno')
  ]
  TIPO_PACOTE = [
    ('AVULSO', 'Avulso'),
    ('NORMAL', 'Normal')
  ]
  TIPO_SEXO = [
    ('F', 'Feminino'),
    ('M', 'Masculino'),
    ('N', 'Não informado')
  ]

  @staticmethod
  def get_desc(var, idx):
    for op in var:
      if op[0] == idx:
        return op[1]
const _MESES = ['JANEIRO', 'FEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

const removerAlertas = () => {
  $(".alert").fadeTo(2000, 500).slideUp(500, function() {
    $(".alert").slideUp(500);
  });
}

const normal_request = (url, parametros = {}, tipo, csrf) => {
  let config = {
    method: tipo,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': csrf
    }
  }

  if (tipo != "GET") {
    config['body'] = JSON.stringify(parametros)
  }

  return new Promise(function(resolve, reject){
    var r = new Request(url, config);
    fetch(r)
    .then((response) => {
      try{
        return response.json()
      } catch(e) {
        reject({'msg': 'Um erro aconteceu no servidor!', 'erro': e})
      }
      
    })
    .then((response) => {
      resolve(response)
    })
    .catch((error) => {
      reject({'msg': 'Um erro aconteceu no servidor!', 'erro': error})
    })
  })
}

const form_data_request = (url, formData, tipo, csrf) => {
  return new Promise(function(resolve, reject){
    $.ajax({
      url: url, type: tipo, data: formData, headers: {
        'X-CSRFToken': csrf
      },
      success: function (response) {
        let json = (typeof response == "string") ? IsJsonString(response): response;
        if(!json){
          reject({'msg': 'Um erro aconteceu no servidor!', 'erro': e});
        } else {
          resolve(json)
        }
      },
      cache: false,
      contentType: false,
      processData: false,
      xhr: function () {
        var myXhr = $.ajaxSettings.xhr()
        return myXhr
      }
    })
    .fail(function() {
      let json = (typeof response == "string") ? IsJsonString(response): response;
      if (json) {
        reject({'msg': json.erro, 'erro': json.erro})
      } else {
        reject({'msg': 'Um erro aconteceu na requisição!'});
      }
    })
  })
}

const IsJsonString = str => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}

const get_args = () => {
  var $_GET = {}
  document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
    function decode(s) {
      return decodeURIComponent(s.split("+").join(" "))
    }
    $_GET[decode(arguments[1])] = decode(arguments[2])
  })
  return $_GET
}

const validarMaxChar = obj => {
  var campo = $(obj)
  var valor = parseInt(campo.attr("maxlength") - campo.val().length)
  if( $(".valida_caractere[for='" + campo.attr("id") + "']").attr("for") != undefined ){
    $(".valida_caractere[for='" + campo.attr("id") + "']").text(valor + " caracteres sobrando")
  }
}

const download_file = file => {
  var file_path = file
  var a = document.createElement('A')
  a.href = file_path
  a.download = file_path.substr(file_path.lastIndexOf('/') + 1)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const selecionado_todos = (val, tam) => val[0] == "0" && tam > 1

const converter_data = data => {
  if(data == null || data == "") {
    return data
  }

  let separador = '', novo_separador = ''
  if (data.includes('/')) {
    separador = '/'
    novo_separador = '-'
  } else {
    separador = '-'
    novo_separador = '/'
  }

  let novaData = data.split(separador);
  return `${novaData[2]}${novo_separador}${novaData[1]}${novo_separador}${novaData[0]}`
}
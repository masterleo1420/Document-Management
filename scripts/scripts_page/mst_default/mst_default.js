var tableMstDefault = "";
var SetOverdueID = "";
const $formAll = $("#form_doc, #form_value, #form_status");
const $btnAll = $("#btnAdd, #btnEdit, #btnDel, #btnSaveOverdue");
const noMstAuth = userDepartmentID != 3 && userDepartmentID != 19;
// console.log('userDepartmentID', userDepartmentID)

function getData(topicName) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/setting/",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({
        TopicName: topicName,
      }),
      success: function (res) {
        if (res.length == 0) {
          let data = JSON.stringify({
            Data: "ไม่มีข้อมูลในระบบ",
          });
          resolve(data);
        } else {
          resolve(res[0]);
        }
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

function getOverdue() {
  $.ajax({
    type: "post",
    url: "/setting/overdue",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (res) {
      let { DayNoBfDue, EmailAlert } = res[0];
      $("#inputBeforeOverdue").val(DayNoBfDue);
      let Email = JSON.parse(EmailAlert);
      $("#selectReqEmail").val("").trigger("change");
      $("#selectReqEmail").val(Email).trigger("change");
    },
    error: function (error) {
      console.log(error);
    },
  });
}

function addNo2Json(json_data) {
  for (let i = 0; i < json_data.length; i++) {
    json_data[i].No = i + 1;
  }
  return json_data;
}

function fillData2Table(json_data, type) {
  if (tableMstDefault) {
    tableMstDefault.destroy();
    $("#tableMstDefault tbody").html("");
  }

  let columns = [];
  let data_length = Object.keys(json_data[0]).length;
  let table_head = $("#tableMstDefault thead tr");

  //* check type
  if (type == "select") {
    $("#form_value .input-group").html(`
      <select class="form-control" id="inputValue" disabled>
        <option value="TRUE">TRUE</option>
        <option value="FALSE">FALSE</option>
      </select>
      `);
  } else {
    $("#form_value .input-group").html(`
      <input class="form-control" id="inputValue" type="${type || "text"}" disabled>
    `);
  }

  $("#btnEdit, #btnDel, #btnSave, #btnCancel").addClass("d-none");
  $("#inputDoc, #inputValue, #selectStatus").val("").prop("disabled", true);
  $("#selectStatus").val("None");

  // 2 {no,name}
  if (data_length == 2) {
    $formAll.addClass("d-none");
    $("#form_doc").removeClass("d-none");

    table_head.html(`
      <th>No</th>
      <th>Document</th>
    `);
    columns = [{ data: "No" }, { data: "Name" }];
  }
  // 3 {no,name,value}
  if (data_length == 3) {
    $formAll.addClass("d-none");
    $("#form_doc, #form_value").removeClass("d-none");

    table_head.html(`
      <th>No</th>
      <th>Document</th>
      <th>Value</th>
    `);
    columns = [
      { data: "No" },
      { data: "Name" },
      {
        data: "Value",
        render: function (data) {
          return new Date(data) != "Invalid Date" ? formatDateName(data) : data;
        },
      },
    ];
  }
  // 4 {no,name,value,status}
  if (data_length == 4) {
    $formAll.removeClass("d-none");
    table_head.html(`
      <th>No</th>
      <th>Document</th>
      <th>Value</th>
      <th>Status</th>
    `);
    columns = [
      { data: "No" },
      { data: "Name" },
      {
        data: "Value",
        render: function (data) {
          return new Date(data) != "Invalid Date" ? formatDateName(data) : data;
        },
      },
      {
        data: "Status",
        render: function (data) {
          if (data == 0) return `On Process`;
          if (data == 1) return `Done`;
          else return `None`;
        },
      },
    ];
  }
  tableMstDefault = $("#tableMstDefault").DataTable({
    bDestroy: true,
    searching: false,
    paging: false,
    info: false,
    scrollCollapse: true,
    scrollX: true,
    data: json_data,
    columns: columns,
  });
}

async function genTable(topicName) {
  let data = await getData(topicName);
  let data_type = data.Type;
  let json_data = JSON.parse(data.JsonData).Data;
  json_data = addNo2Json(json_data);
  fillData2Table(json_data, data_type);
}

function setDefault() {
  let topicName = "Change Item";
  $("#mstOverdue").addClass("d-none");
  $("#mstDefault").removeClass("d-none");
  $("#topicName").html(topicName);
  genTable(topicName);
}

function dropdownSetting(targetDp) {
  $.ajax({
    type: "post",
    url: "/dropdown/defaults",
    contentType: "application/json; charset=utf-8",
    dataType: "json",

    success: function (res) {
      let select = $(`${targetDp}`);
      select.empty();
      select.append(`
        <optgroup label="PPC"></optgroup>
        <optgroup label="ECN"></optgroup>
        <optgroup label="Other"></optgroup>
      `);
      res.forEach((item) => {
        let select_optgroup = $(`${targetDp} optgroup[label="${item.DocumentName}"]`);
        if (item.DocumentName == "OTH") {
          SetOverdueID = item.DefaultID;
          select_optgroup = $(`${targetDp} optgroup[label="Other"]`);
        }
        select_optgroup.append(`<option value="${item.DefaultID}">${item.TopicName}</option>`);
      });
      // select2Single(targetDp);
    },
  });
}

$(document).ready(function () {
  if (noMstAuth) $btnAll.prop("disabled", true);
  Notification();
  dropdownEmail("#selectReqEmail");
  dropdownSetting("#selectTopic");

  //* data
  $("#selectTopic").change(async function () {
    let topicNo = $(this).val();
    let topicName = $("#selectTopic option:selected").text();
    $("#btnAdd").removeClass("d-none");
    $("#inputDoc, #inputValue, #selectStatus").val("").attr("disabled", true);
    $("#selectStatus").val("0");
    $("#inputValue").attr("type", "text");
    // ** get data
    let data = await getData(topicName);
    let data_type = data.Type;
    let json_data = JSON.parse(data.JsonData).Data;
    json_data = addNo2Json(json_data);
    if (topicNo == SetOverdueID) {
      //* Setting Overdue
      $("#mstOverdue").removeClass("d-none");
      $("#mstDefault").addClass("d-none");
      getOverdue();
    } else {
      //* Setting Default
      $("#mstOverdue").addClass("d-none");
      $("#mstDefault").removeClass("d-none");
      $("#topicName").html(topicName);
      fillData2Table(json_data, data_type);
    }
  });

  setDefault();

  // note: click table
  $("#tableMstDefault tbody").on("click", "tr", function () {
    $("#inputDoc, #inputValue, #selectStatus").val("").prop("disabled", true);
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnAdd, #btnEdit, #btnDel, #btnSave, #btnCancel").addClass("d-none");
      $("#btnAdd").removeClass("d-none");
      if (noMstAuth) $btnAll.prop("disabled", true);
    } else {
      $("#tableMstDefault tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");

      $("#btnAdd, #btnEdit, #btnDel").removeClass("d-none");
      $("#btnSave, #btnCancel").addClass("d-none");

      let data = tableMstDefault.row(this).data();
      $("#inputDoc").val(data.Name);
      $("#inputValue").val(data.Value);
      $("#selectStatus").val(data.Status);
      if (noMstAuth) $btnAll.prop("disabled", true);
    }
  });

  // note: add
  $("#btnAdd").unbind();
  $("#btnAdd").click(function () {
    $("#tableMstDefault tbody tr.selected").removeClass("selected");
    $("#inputDoc, #inputValue, #selectStatus").val("").prop("disabled", false);
    $("#selectStatus").val("0");
    $("#btnAdd, #btnEdit, #btnDel").addClass("d-none");
    $("#btnSave, #btnCancel").removeClass("d-none");

    let array = tableMstDefault.rows().data().toArray();
    let array_obj = [];
    array.forEach((e) => {
      delete e.No;
      array_obj.push(e);
    });
    let obj_length = Object.keys(array_obj[0]).length;

    $("#btnSave").unbind();
    $("#btnSave").click(function () {
      if ($("#inputDoc").val() != "") {
        let DefaultID = $("#selectTopic").val();
        let JsonData;
        let new_data = { Name: $("#inputDoc").val(), Value: $("#inputValue").val(), Status: $("#selectStatus").val() || 0 };

        if (obj_length == 1) {
          delete new_data.Value;
          delete new_data.Status;
        } else if (obj_length == 2) {
          delete new_data.Status;
        }
        array_obj.push(new_data);
        JsonData = JSON.stringify({ Data: array_obj });

        let data = JSON.stringify({
          DefaultID,
          JsonData,
        });
        $.ajax({
          type: "put",
          url: "/setting/edit",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data,
          success: function (res) {
            let topicName = $("#selectTopic option:selected").text();
            genTable(topicName);
            $("#btnAdd").removeClass("d-none");
            Swal.fire({
              position: "center",
              icon: "success",
              title: "บันทึกข้อมูลสําเร็จ",
              showConfirmButton: false,
              timer: 1500,
            });
          },
          error: function (error) {
            // console.log(error);
            errorText = error.responseJSON.message;
            Swal.fire({
              position: "center",
              icon: "warning",
              title: "Warning",
              text: errorText,
              showConfirmButton: true,
              confirmButtonText: "OK",
              confirmButtonColor: "#dc3545",
            });
          },
        });
      } else {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "Warning",
          text: "กรุณากรอกข้อมูล Document",
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    });
  });

  // note: edit
  $("#btnEdit").unbind();
  $("#btnEdit").click(function () {
    let topicName = $("#selectTopic option:selected").text();
    $("#inputDoc, #inputValue, #selectStatus").prop("disabled", false);
    $("#btnAdd, #btnEdit").addClass("d-none");
    $("#btnSave, #btnCancel, #btnDel").removeClass("d-none");

    if (topicName == "Engineering Process") {
      if (!$("#inputValue").val()) $("#selectStatus").prop("disabled", true);
      $("#inputValue").change(function () {
        console.log("this", this.value);
        if (!this.value) $("#selectStatus").prop("disabled", true).val("None");
        else $("#selectStatus").prop("disabled", false);
      });
    }

    let array = tableMstDefault.rows().data().toArray();
    let array_obj = [];
    let selected_No = tableMstDefault.row(".selected").data().No - 1;

    array.forEach((e) => {
      delete e.No;
      array_obj.push(e);
    });
    let obj_length = Object.keys(array_obj[0]).length;

    $("#btnSave").unbind();
    $("#btnSave").click(function () {
      if ($("#inputDoc").val() != "") {
        let DefaultID = $("#selectTopic").val();
        let JsonData;
        let update_array = array_obj[selected_No];
        // console.log("update_array", update_array);
        update_array.Name = $("#inputDoc").val();
        update_array.Value = $("#inputValue").val();
        update_array.Status = $("#selectStatus").val() || 0;

        if (obj_length == 1) {
          delete update_array.Value;
          delete update_array.Status;
        } else if (obj_length == 2) {
          delete update_array.Status;
        }

        JsonData = JSON.stringify({ Data: array_obj });
        console.log("JsonData ==> ", JsonData);
        let data = JSON.stringify({
          DefaultID,
          JsonData,
        });

        $.ajax({
          type: "put",
          url: "/setting/edit",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data,
          success: function (res) {
            let topicName = $("#selectTopic option:selected").text();
            $("#tableMstDefault tbody tr.selected").removeClass("selected");
            genTable(topicName);
            $("#btnAdd").removeClass("d-none");
            Swal.fire({
              position: "center",
              icon: "success",
              title: "แก้ไขข้อมูลสําเร็จ",
              showConfirmButton: false,
              timer: 1500,
            });
          },
          error: function (error) {
            // console.log(error);
            errorText = error.responseJSON.message;
            Swal.fire({
              position: "center",
              icon: "warning",
              title: "Warning",
              text: errorText,
              showConfirmButton: true,
              confirmButtonText: "OK",
              confirmButtonColor: "#dc3545",
            });
          },
        });
      } else {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "Warning",
          text: "กรุณากรอกข้อมูล Document",
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    });
  });

  // note: delete
  $("#btnDel").unbind();
  $("#btnDel").on("click", function () {
    Swal.fire({
      title: "ยืนยันการลบข้อมูล",
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        let array = tableMstDefault.rows().data().toArray();
        let array_obj = [];
        let selected_No = tableMstDefault.row(".selected").data().No - 1;

        array.forEach((e) => {
          delete e.No;
          array_obj.push(e);
        });
        array_obj.splice(selected_No, 1);

        let DefaultID = $("#selectTopic").val();
        let JsonData;

        JsonData = JSON.stringify({ Data: array_obj });
        let data = JSON.stringify({
          DefaultID,
          JsonData,
        });

        // todo ajax
        $.ajax({
          type: "put",
          url: "/setting/edit",
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data,
          success: function (res) {
            let topicName = $("#selectTopic option:selected").text();
            $("#tableMstDefault tbody tr.selected").removeClass("selected");
            genTable(topicName);
            $("#btnAdd").removeClass("d-none");
            Swal.fire({
              position: "center",
              icon: "success",
              title: "ลบข้อมูลสําเร็จ",
              showConfirmButton: false,
              timer: 1500,
            });
          },
          error: function (error) {
            // console.log(error);
            errorText = error.responseJSON.message;
            Swal.fire({
              position: "center",
              icon: "warning",
              title: "Warning",
              text: errorText,
              showConfirmButton: true,
              confirmButtonText: "OK",
              confirmButtonColor: "#dc3545",
            });
          },
        });
      }
    });
  });

  // note: Cancel
  $("#btnCancel").unbind();
  $("#btnCancel").on("click", function () {
    $("#tableMstDefault tbody tr.selected").removeClass("selected");
    $("#btnAdd, #btnEdit, #btnDel, #btnSave, #btnCancel").addClass("d-none");
    $("#btnAdd").removeClass("d-none");
    $("#inputDoc, #inputValue, #selectStatus").val("").prop("disabled", true);
  });

  // note: Save
  $("#btnSaveOverdue").unbind();
  $("#btnSaveOverdue").on("click", function () {
    let DayNoBfDue = $("#inputBeforeOverdue").val();
    let EmailAlert = $("#selectReqEmail").val();
    EmailAlert = JSON.stringify(EmailAlert);
    let data = JSON.stringify({ DayNoBfDue, EmailAlert });
    $.ajax({
      type: "put",
      url: "/setting/overdue/edit",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data,
      success: function (res) {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "บันทึกข้อมูลสําเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });
      },
      error: function (error) {
        errorText = error.responseJSON.message;
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "Warning",
          text: errorText,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      },
    });
  });
});

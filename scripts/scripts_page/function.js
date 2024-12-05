const defaultCustomer = ["Customer1", "Customer2", "Customer3", "Customer4"];
const defaultEmail = ["Email1@example.com", "Email2@example.com", "Email3@example.com"];
const defaultEngineeringID = 3;
let getUserID = 0;
let getDate = 0;
let valueProjectPart = [];
const userName = getCookie("name");
const userPosition = getCookie("PositionName");
let inputSignDateRevise = null;
const userDepartmentID = getCookie("DepartmentID");
const getDepartmentName = getCookie("DepartmentName");
$("#departmentName").html(getDepartmentName);
$(".show-user-name").text(userName);
$("#userPosition").text(userPosition);

userDepartmentID == 3 || userDepartmentID == 19 ? $(".nav-mst-default").removeClass("d-none") : $(".nav-mst-default").addClass("d-none");

function scrollPageTo(target, t = 1000) {
  $("html, body").animate(
    {
      scrollTop: $(`#${target}`).offset().top,
    },
    t
  );
}

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // เดือนเริ่มจาก 0, จึงต้อง +1
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // เดือนเริ่มจาก 0, จึงต้อง +1
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const data = {};
  for (const [key, value] of params.entries()) {
    data[key] = value;
  }
  return data;
}

//* Convert Date
function formatDateToFullMonth(date) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day = date.getDate();
  const month = monthNames[date.getMonth()]; // รับชื่อเดือนจาก array
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateName(data) {
  let now = data ? new Date(data) : new Date();
  let year = now.getFullYear(); // แก้ไขให้เป็นเวลาท้องถิ่น
  let day = now.getDate().toString().padStart(2, "0"); // แก้ไขให้เป็นเวลาท้องถิ่น

  let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let monthIndex = now.getMonth(); // แก้ไขให้เป็นเวลาท้องถิ่น
  let monthName = monthNames[monthIndex];
  let currentDateTime_monthName = `${day} ${monthName} ${year}`;

  return currentDateTime_monthName;
}

function formatDate(date) {
  let now = date ? new Date(date) : new Date();
  let year = now.getUTCFullYear();
  let month = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  let day = now.getUTCDate().toString().padStart(2, "0");
  let hours = now.getUTCHours().toString().padStart(2, "0");
  let minutes = now.getUTCMinutes().toString().padStart(2, "0");
  let currentDateTime = `${year}-${month}-${day}`;
  return currentDateTime;
}


function formatFullMonthToDate(date) {
  const now = new Date(date);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // เดือนเริ่มจาก 0, จึงต้อง +1
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dropdownCustomer(targetDp) {
  $.ajax({
    type: "post",
    url: "/dropdown/customer",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (res) {
      let select = $(`${targetDp}`);
      select.empty();

      res.forEach((item) => {
        select.append(`<option value="${item.CustomerName}" data-id="${item.CustomerID}">${item.CustomerName}</option>`);
      });

      // select.attr("title", "กรุณาเลือก");
      select2Single(targetDp);
    },
  });
}

function dropdownRequestDepartment(targetDp) {
  $.ajax({
    type: "post",
    url: "/dropdown/department",
    contentType: "application/json; charset=utf-8",
    dataType: "json",

    success: function (res) {
      let select = $(`${targetDp}`);
      select.empty();
      res.forEach((item) => {
        select.append(`<option value="${item.DepartmentID}">${item.DepartmentName}</option>`);
      });
      select2Single(targetDp);
    },
  });
}

function dropdownRequestDepartment_name(targetDp) {
  $.ajax({
    type: "post",
    url: "/dropdown/department",
    contentType: "application/json; charset=utf-8",
    dataType: "json",

    success: function (res) {
      let select = $(`${targetDp}`);
      select.empty();
      res.forEach((item) => {
        select.append(`<option value="${item.DepartmentName}">${item.DepartmentName}</option>`);
      });
      select2Single(targetDp);
    },
  });
}

function dropdownProject(targetDp, CustomerName, target) {
  $.ajax({
    type: "post",
    url: "/dropdown/project",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify({ CustomerName: CustomerName }),
    success: function (res) {
      let select = $(`${targetDp}`);
      select.empty();
      res.forEach((item) => {
        select.append(`<option value="${item?.Model}" ${item?.Model == target ? "selected" : ""}>${item?.Model}</option>`);
      });
      select2Single(targetDp);
    },
  });
}

function dropdownProjectPart(targetDp, CustomerName, Model, value) {
  $.ajax({
    type: "post",
    url: "/dropdown/project/part",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify({
      CustomerName: CustomerName,
      Model: Model,
    }),
    success: function (res) {
      valueProjectPart = res;
      let select = $(`${targetDp}`);
      select.empty();
      res.forEach((item) => {
        select.append(`<option value="${item?.PartCode}" ${item?.PartCode == value ? "selected" : ""}>${item?.PartCode}</option>`);
        if (item?.PartCode == value) $("#inputPartName_Request").val(item.PartName);
      });
      select2Single(targetDp);
      if (!value) {
        if (res.length) {
          $("#inputPartName_Request").val(res[0].PartName);
        } else {
          $("#inputPartName_Request").val("");
        }
      }
    },
  });
}

function dropdownEmail(targetDp) {
  $.ajax({
    type: "post",
    url: "/dropdown/email",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (res) {
      let select = $(`${targetDp}`);
      select.empty();
      res.forEach((item) => {
        select.append(`<option value="${item.Email}">${item.Email}</option>`);
      });
      select2MultipleAutoAdd(targetDp);
    },
  });
}

function select2Single(selectID) {
  $(`${selectID}`).select2({
    theme: "bootstrap",
  });
}

function select2MultipleAutoAdd(selectID) {
  $(`${selectID}`).select2({
    // placeholder: "Select options",
    theme: "bootstrap",
    tags: true, // Enable tag creation
    createTag: function (params) {
      var term = $.trim(params.term);

      // ตรวจสอบว่าค่าที่ค้นหามีอยู่แล้วหรือไม่
      var exists = false;
      $(`${selectID} option`).each(function () {
        if ($(this).text().toUpperCase() === term.toUpperCase()) {
          exists = true;
          return false;
        }
      });

      // หากค่าที่ค้นหาไม่ซ้ำกับที่มีอยู่ ให้สร้างแท็กใหม่
      if (!exists) {
        return {
          id: term,
          text: term,
          newOption: true,
        };
      }

      // หากค่าที่ค้นหาซ้ำกับที่มีอยู่ ให้คืนค่า null
      return null;
    },
    insertTag: function (data, tag) {
      // Insert the new tag at the end of the results
      data.push(tag);
    },
  });

  // $(`#${selectID}`).on("select2:select", function (e) {
  // });
}

//* swalalertSign
function swalalertSign(btnID, item, checkSign, selectedRows) {
  let _this = $(`#${btnID}`);

  let title = _this.attr("swal-title");
  let titleData = _this.data("title");
  let targetShowSign = _this.attr("swal-target");
  let targetShowSignData = _this.data("target");
  let selectID = _this.data("select");
  // let inputID = _this.data("input");
  // let default_name = $(".show-user-name").html();
  let DepartmentID = event.target.getAttribute("data-id");
  let default_date = getCurrentDate();

  //* table
  // let tbPJlist = tbProjectList();
  // let tbPJrevise = tbProjectRevise()

  Swal.fire({
    title: title ? title : titleData,
    html: `
      <div class="form-group row w-100">
        <label class="col-sm-3 form-control-label">Username</label>
        <div class="col-sm-9">
          <input type="text" class="form-control" id="inputSignUsername" autocomplete="off" value=""/>
        </div>
      </div>
      <div class="form-group row w-100">
        <label class="col-sm-3 form-control-label">Password</label>
        <div class="col-sm-9">
          <input type="Password" class="form-control" id="inputSignPassword" autocomplete="off" value=""/>
        </div>
      </div>
      <div class="form-group row w-100">
        <label class="col-sm-3 form-control-label">Date</label>
        <div class="col-sm-9">
          <input type="date" class="form-control" id="inputSignDate" autocomplete="off" value="${default_date}"/>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "#0275d8",
    cancelButtonColor: "#f44455",
    confirmButtonText: "Submit",
    cancelButtonText: "close",
    preConfirm: function () {
      let name = $("#inputSignUsername").val();
      let date = $("#inputSignDate").val();
      if (!name || !date) {
        name = "";
        date = "";
      }

      return {
        name: name,
        date: date,
      };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const { date, name } = result.value;
      let date_show = date ? new Date(date) : "";
      let signBy = !name || !date ? "" : `${name} ${formatDateName(date_show)}`;
      inputSignDateRevise = date;
      getDate = $("#inputSignDate").val();

      //* check sign
      let Username = $("#inputSignUsername").val();
      let Password = $("#inputSignPassword").val();
      let ProjectID = item ? item.ProjectID : null;
      let ProjectPartID = item ? item.ProjectPartID : null;
      let PPCReqID = item ? item.PPCReqID : null;
      let PPCReplyID = item ? item.PPCReplyID : null;
      let PPCApproveID = item ? item.PPCApproveID : null;
      let PPCStartID = item ? item.PPCStartID : null;
      let ECNApproveID = item ? item.ECNApproveID : null;

      //* check กรอก issue add กับ issue edit
      //* check ถ้ามี username และ password และไม่มี projectID
      if (Username && Password && !ProjectID && (!ProjectPartID || !PPCReqID) && !ECNApproveID) {
        $.ajax({
          type: "POST",
          url: "/project/user/check",
          data: JSON.stringify({
            Username,
            Password,
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function (response) {
            $(`#${targetShowSign}`).val(`${response[0].FirstName} ${formatDateName(date_show)}`);
            getUserID = response[0].UserID;
            // $(`#${targetShowSign}`).val(signBy);
            Swal.fire({
              position: "center",
              icon: "success",
              title: "ลงชื่อสำเร็จ",
              showConfirmButton: false,
              timer: 1500,
            });
          },
          error: function (error) {
            console.log(error);
            errorText = error.responseJSON.message;
            $("#showReq_Request").val("");
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

      //* แยก Path ที่เข้ามาว่า part หรือไม่มี
      let checkSignArry = checkSign.split("/");

      //* หน้า mainProject
      function mstProject() {
        //* data หน้า mainProject
        let htmlEdit = `
        <button type="button" class="btn btn-fw info show-edit" id="btnPJedit" disabled>
          <i class="fa fa-edit"></i><span class="hidden-xs-down ml-2">Edit</span>
        </button>
        `
        let mstProjectdata = {
          ProjectID,
          Username,
          Password,
        };

        if (checkSignArry[2] == "issue") {
          mstProjectdata["IssueSignTime"] = $("#inputSignDate").val();
        } else if (checkSignArry[2] == "check") {
          mstProjectdata["CheckSignTime"] = $("#inputSignDate").val();
        } else if (checkSignArry[2] == "approve") {
          mstProjectdata["ApproveSignTime"] = $("#inputSignDate").val();
        } else if (checkSignArry[2] == "sopapprove") {
          mstProjectdata["SopApproveSignTime"] = $("#inputSignDate").val();
        }

        //* หลังจากเพิ่มข้อมูลลงใน object แล้วค่อย stringify
        let jsonmstProjectdata = JSON.stringify(mstProjectdata);

        if (checkSignArry[1] == "sign") {
          if (Username && Password && ProjectID) {
            $.ajax({
              type: "PUT",
              url: `/project${checkSign}`,
              data: jsonmstProjectdata,
              contentType: "application/json; charset=utf-8",
              dataType: "json",
              success: function (response) {
                Notification();
                if (targetShowSign) {
                  if (response.name) {
                    $(`#${targetShowSign}`).val(`${response.name} ${formatDateName(response.signTime)}`);
                  } else {
                    $(`#${targetShowSign}`).val("");
                  }
                }

                tbPJlist.ajax.reload(null, false);
                $("#tablePJmaster")
                .off("draw.dt")
                .on("draw.dt", function () {
                  reselectRows($("#tablePJmaster").DataTable(), selectedRows);
                  // signDis()
                  let data = tbPJlist.row('.selected').data();
                  if(data.ProjectStatus == 4 || data.ProjectStatus == 3){
                    // $("#btnPJedit").prop("disabled", false)
                    $("#selectCustomer").prop("disabled", true)
                    $("#inputModel").prop("disabled", true)
                    $("#inputSOPDate").prop("disabled", true)
                    $("#btnPJedit").prop("disabled", true)
                    $("#btnPJdel").prop("disabled", true)
                    $("#btnEditAndSave").html(htmlEdit);
                  }else{
                    // $("#btnPJedit").prop("disabled", false)
                    $("#btnPJedit").prop("disabled", false)
                    $("#btnPJdel").prop("disabled", false)
                  }
                
                });
                // tbPJlist.ajax.reload(null, false);
                Swal.fire({
                  position: "center",
                  icon: "success",
                  title: response.message,
                  showConfirmButton: false,
                  timer: 1500,
                });
              },
              error: function (error) {
                console.log(error.responseJSON.message);
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
        }
      }

      //* หน้า ProjectRevise
      function projectRevise() {
        //* data หน้า ProjectRevise
        let projectRevisedata = {
          ProjectPartID,
          Username,
          Password,
        };

        if (checkSignArry[3] == "issue") {
          projectRevisedata["IssueSignTime"] = $("#inputSignDate").val();
        } else if (checkSignArry[3] == "check") {
          projectRevisedata["CheckSignTime"] = $("#inputSignDate").val();
        } else if (checkSignArry[3] == "approve") {
          projectRevisedata["ApproveSignTime"] = $("#inputSignDate").val();
        }

        let jsonProjectRevisedata = JSON.stringify(projectRevisedata);

        if (checkSignArry[1] == "part") {
          if (Username && Password && ProjectPartID) {
            //* check Project Revise Sign
            $.ajax({
              type: "PUT",
              url: `/project${checkSign}`,
              data: jsonProjectRevisedata,
              contentType: "application/json; charset=utf-8",
              dataType: "json",
              success: function (response) {
                Notification();
                if (targetShowSign) {
                  if (response.name) {
                    $(`#${targetShowSign}`).val(`${response.name} ${formatDateName(response.signTime)}`);
                  } else {
                    $(`#${targetShowSign}`).val("");
                  }
                }

                Swal.fire({
                  position: "center",
                  icon: "success",
                  title: response.message,
                  showConfirmButton: false,
                  timer: 1500,
                });

                tbPJrevise.ajax.reload(null, false);
                $("#tablePJrevise")
                  .off("draw.dt")
                  .on("draw.dt", function () {
                    reselectRows($("#tablePJrevise").DataTable(), selectedRows);
                    let data = tbPJrevise.rows(".selected").data()[0] || null;
                    if (data?.PartStatus == 3) {
                      if (data?.DocFilePath == "") {
                        $("#btnPJReviseStamping").prop("disabled", true);
                      } else {
                        $("#btnPJReviseStamping").prop("disabled", false);
                      }
                      $("#btnPJReviseStamping").removeClass("d-none");
                      $("#btnPJReviseDel").prop("disabled", true);
                      $("#btnSignIssue").prop("disabled", true);
                      $("#btnSignCheck").prop("disabled", true);
                      $("#btnSignApprove").prop("disabled", true);
                    } else {
                      $("#btnPJReviseStamping").addClass("d-none");
                      $("#btnPJReviseDel").prop("disabled", false);
                      $("#btnSignIssue").prop("disabled", false);
                      $("#btnSignCheck").prop("disabled", false);
                      $("#btnSignApprove").prop("disabled", false);
                    }
                  });
              },
              error: function (error) {
                console.log(error);
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
        }
      }

      //* PPC
      function projectPPC() {
        //* data หน้า PPC
        let ppcSign_request = {
          Username,
          Password,
        };

        if (checkSignArry[3] == "requestby") {
          //* Request
          ppcSign_request["RequestSignTime"] = $("#inputSignDate").val();
          ppcSign_request.PPCReqID = PPCReqID;
        } else if (checkSignArry[3] == "reply") {
          //* Engineer Reply
          ppcSign_request["ReplySignTime"] = $("#inputSignDate").val();
          ppcSign_request.PPCReplyID = PPCReplyID;
        } else if (checkSignArry[3] == "concernDeptApprove") {
          //* Approve Plan
          ppcSign_request["DateSignTime"] = $("#inputSignDate").val();
          ppcSign_request.PPCApproveID = PPCApproveID;
          ppcSign_request.DepartmentID = DepartmentID;
        } else if (checkSignArry[3] == "submitplanby") {
          ppcSign_request["SubmitDate"] = $("#inputSignDate").val();
          ppcSign_request.PPCApproveID = PPCApproveID;
        } else if (checkSignArry[1] == "approveplan" && checkSignArry[3] == "chcekBy") {
          ppcSign_request["CheckSignTime"] = $("#inputSignDate").val();
          ppcSign_request.PPCApproveID = PPCApproveID;
        } else if (checkSignArry[1] == "approveplan" && checkSignArry[3] == "approveby") {
          ppcSign_request["ApporveSignTime"] = $("#inputSignDate").val();
          ppcSign_request.PPCApproveID = PPCApproveID;
        } else if (checkSignArry[1] == "approvestart" && checkSignArry[3] == "checkby") {
          //* Approve Start
          ppcSign_request["SignTimeCheckBy"] = $("#inputSignDate").val();
          ppcSign_request.PPCStartID = PPCStartID;
        } else if (checkSignArry[1] == "approvestart" && checkSignArry[3] == "approveby") {
          ppcSign_request["ApproveSignTimeStart"] = $("#inputSignDate").val();
          ppcSign_request.PPCStartID = PPCStartID;
        } else if (checkSignArry[3] == "concernDeptStart") {
          ppcSign_request["DeptSignTimeStart"] = $("#inputSignDate").val();
          ppcSign_request.PPCStartID = PPCStartID;
          ppcSign_request.DepartmentID = DepartmentID;
        }

        let jsonPpcSign_request = JSON.stringify(ppcSign_request);

        //* check Project Revise Sign

        if (Username && Password && PPCReqID) {
          $.ajax({
            type: "PUT",
            url: `/ppc${checkSign}`,
            data: jsonPpcSign_request,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
              let selectedValues = $(`#${selectID}`).val() || [];
              if (targetShowSign) {
                if (response.ReqestBy) {
                  $(`#${targetShowSign}`).val(`${response.ReqestBy} ${formatDateName(response.RequsetSignTime)}`);
                } else if (response.ReplyBy) {
                  $(`#${targetShowSign}`).val(`${response.ReplyBy} ${formatDateName(response.ReplyTime)}`);
                } else if (response.SubmitPlanby) {
                  $(`#${targetShowSign}`).val(`${response.SubmitPlanby} ${formatDateName(response.SubmitTime)}`);
                } else if (response.chcekBy) {
                  $(`#${targetShowSign}`).val(`${response.chcekBy} ${formatDateName(response.CheckTime)}`);
                } else if (response.ApproveBy) {
                  $(`#${targetShowSign}`).val(`${response.ApproveBy} ${formatDateName(response.ApproveTime)}`);
                } else if (response.startCheckBy) {
                  $(`#${targetShowSign}`).val(`${response.startCheckBy} ${formatDateName(response.SignCheckTime)}`);
                } else if (response.startApproveBy) {
                  $(`#${targetShowSign}`).val(`${response.startApproveBy} ${formatDateName(response.SignPlanStartTime)}`);
                } else {
                  $(`#${targetShowSign}`).val("");
                }
              } else if (targetShowSignData) {
                if (selectID === "selectConcernDept_approvePlan") {
                  UpdateSignConcernDept_ApPlan(response.User);
                } else if (selectID === "selectConcernDept_approveStart") {
                  UpdateSignConcernDept_ApStart(response.User);
                }
                selectedValues.forEach((value) => {
                  let inputId = "";
                  if (selectID === "selectConcernDept_approvePlan") {
                    inputId = `inputConcern_${value}`;
                  } else if (selectID === "selectConcernDept_approveStart") {
                    inputId = `inputConcernStart_${value}`;
                  }

                  let getItem = response.User.find((item) => item.DepartmentID == value) || {};
                  let getInputVal_Sign = getItem.Value || [];
                  let value_input =
                    getInputVal_Sign.length > 0
                      ? getInputVal_Sign
                          .map(
                            (item) => `${item.Name} ${item.DateSignTime ? formatDateName(item.DateSignTime) : formatDateName(item.DeptSignTimeStart)}`
                          )
                          .join(" , ")
                      : "";
                  $(`#${inputId}`).val(value_input);
                });
              }
              signInputDis();
              Notification();

              Swal.fire({
                position: "center",
                icon: "success",
                title: `${response.message}`,
                showConfirmButton: false,
                timer: 1500,
              });
            },
            error: function (error) {
              console.log(error);
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
      }

      //* ECN
      function projectECN() {
        let ecnSign_request = {
          Username,
          Password,
        };
        if (checkSignArry[3] == "issue") {
          ecnSign_request["SignIssueTime"] = $("#inputSignDate").val();
          ecnSign_request.ECNApproveID = ECNApproveID;
        } else if (checkSignArry[3] == "check") {
          ecnSign_request["SignCheckTime"] = $("#inputSignDate").val();
          ecnSign_request.ECNApproveID = ECNApproveID;
        } else if (checkSignArry[3] == "approve") {
          ecnSign_request["SignApproveTime"] = $("#inputSignDate").val();
          ecnSign_request.ECNApproveID = ECNApproveID;
        } else if (checkSignArry[3] == "dept") {
          ecnSign_request["DateSignTime"] = $("#inputSignDate").val();
          ecnSign_request.ECNApproveID = ECNApproveID;
          ecnSign_request.DepartmentID = DepartmentID;
        }
        let jsonECNSign_request = JSON.stringify(ecnSign_request);
        if (Username && Password && ECNApproveID) {
          $.ajax({
            type: "PUT",
            url: `/ecn${checkSign}`,
            data: jsonECNSign_request,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
              let selectedValues = $(`#${selectID}`).val() || [];
              if (targetShowSign) {
                if (response.name) {
                  let inputData = `${response.name} ${formatDateName(response.signTime)}`;
                  $(`#${targetShowSign}`).val(`${inputData}`);
                } else {
                  $(`#${targetShowSign}`).val("");
                }
              } else if (targetShowSignData) {
                if (selectID === "selectConcernDept") {
                  UpdateSignConcernDept(response.User);
                }
                selectedValues.forEach((value) => {
                  let inputId = "";
                  if (selectID === "selectConcernDept") {
                    inputId = `inputConcern_${value}`;
                  }
                  let getItem = response.User.find((item) => item.DepartmentID == value) || {};
                  let getInputVal_Sign = getItem.Value || [];
                  let value_input =
                    getInputVal_Sign.length > 0
                      ? getInputVal_Sign.map((item) => `${item.Name} ${formatDateName(item.DateSignTime)}`).join(" , ")
                      : "";
                  $(`#${inputId}`).val(value_input);
                });
              }

              tbEcnIssue();
              $("#tableReqECN")
                .off("draw.dt")
                .on("draw.dt", function () {
                  reselectRows($("#tableReqECN").DataTable(), selectedRows);
                  let data = tableReqECN.rows(".selected").data()[0];
                  if (data.ECNStatus == 3 || data.ECNStatus == 4 || data.Active == 0) {
                    $("#btnECNedit, #btnECNdel").prop("disabled", true);
                    $(".dis_sign, .dis_input").prop("disabled", true);
                    $("#btn_saveECNApprove").prop("disabled", true);
                  }
                  // getECNApprove()
                  // signDis()
                });
              // TODO

              Notification();
              Swal.fire({
                position: "center",
                icon: "success",
                title: `${response.message}`,
                showConfirmButton: false,
                timer: 1500,
              });
            },
            error: function (error) {
              console.log(error);
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
      }
      mstProject();
      projectRevise();
      projectPPC();
      projectECN();
    }
  });
}

function sendMail(id, checkRout, getSelectTb) {
  let checkSendRout = checkRout.split("/");
  let SendEmail = $(`#${id}`).val();

  console.log('checkRout :>> ', checkRout);
  let ProjectID = getSelectTb ? getSelectTb.ProjectID : null;
  let PPCReqID = getSelectTb ? getSelectTb.PPCReqID : null;
  let PPCReplyID = getSelectTb ? getSelectTb.PPCReplyID : null;
  let PPCApproveID = getSelectTb ? getSelectTb.PPCApproveID : null;
  let PPCStartID = getSelectTb ? getSelectTb.PPCStartID : null;
  let ECNIssueID = getSelectTb ? getSelectTb.ECNIssueID : null;
  let ECNApproveID = getSelectTb ? getSelectTb.ECNApproveID : null;

  if (ProjectID) {
    function project() {
      let sendMail = {
        SendEmail,
        ProjectID,
      };

      let jsonSendMail = JSON.stringify(sendMail);

      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: `/project${checkRout}`,
        data: jsonSendMail,
        success: function (response) {
          Swal.fire({
            position: "center",
            icon: "success",
            title: response.message,
            showConfirmButton: false,
            timer: 1500,
          });
        },
        error: function (error) {
          console.log(error);
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
    project();
  } else if (PPCReqID || PPCReplyID || PPCApproveID || PPCStartID) {
    //*PPC
    function ppc() {
      let sendMail = {
        SendEmail,
      };

      if (checkSendRout[1] == "request") {
        sendMail.PPCReqID = PPCReqID;
      } else if (checkSendRout[1] == "engreply") {
        sendMail.PPCReplyID = PPCReplyID;
      } else if (checkSendRout[1] == "approveplan") {
        sendMail.PPCApproveID = PPCApproveID;
      } else if (checkSendRout[1] == "approvestart") {
        sendMail.PPCStartID = PPCStartID;
      }

      let jsonSendMail = JSON.stringify(sendMail);
      console.log('sendMail :>> ', sendMail);

      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: `/ppc${checkRout}`,
        data: jsonSendMail,
        success: function (response) {
          // $(`#${id}`).val("").change();
          Swal.fire({
            position: "center",
            icon: "success",
            title: response.message,
            showConfirmButton: false,
            timer: 1500,
          });
        },
        error: function (error) {
          console.log(error);
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
    ppc();
  } else if (ECNIssueID || ECNApproveID) {
    function ecn() {
      let sendMail = {
        SendEmail,
      };
      if (checkSendRout[1] == "issue") {
        sendMail.ECNIssueID = ECNIssueID;
      } else if (checkSendRout[1] == "approval") {
        sendMail.ECNApproveID = ECNApproveID;
      }

      let jsonSendMail = JSON.stringify(sendMail);

      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: `/ecn${checkRout}`,
        data: jsonSendMail,
        success: function (response) {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Send complete",
            showConfirmButton: false,
            timer: 1500,
          });
        },
        error: function (error) {
          console.log(error);
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
    ecn();
  }
}

function getDetailAxCode() {
  $.ajax({
    type: "get",
    url: `dummy.json`,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (response) {
      // ลองเพิ่มโค้ดที่ต้องการใช้งานข้อมูลที่ดึงมาได้ที่นี่
    },
    error: function (err) {
      console.log(err);
      // const errorText = err.responseJSON ? err.responseJSON.message : 'An error occurred';
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

function Notification() {
  //*example Notification("countPPCissue","/ppc/noti")
  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: `/notification`,
    success: function (res) {
      let ProjectCount = res.Project[0].ProjectCount;
      let PCCnoti = res.PPC[0].PCCnoti;
      let ExternalCount = res.PPC[0].ExternalCount;
      let ECNNoti = res.ECN[0].ECNNoti;
      ProjectCount ? $(`#countPJissue`).text(ProjectCount).show() : $(`#countPJissue`).hide();
      PCCnoti ? $(`#countPPCissue`).text(PCCnoti).show() : $(`#countPPCissue`).hide();
      ExternalCount ? $(`#countPPCissueNoneShow`).text(ExternalCount).show() : $(`#countPPCissueNoneShow`).hide();
      ECNNoti ? $(`#countECNissue`).text(ECNNoti).show() : $(`#countECNissue`).hide();
    },

    error: function (err) {
      console.log(err);
    },
  });
}
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function reselectRows(table, selectedRows) {
  table
    .rows()
    .nodes()
    .to$()
    .each(function (index) {
      if (selectedRows.includes(index)) {
        $(this).addClass("selected");
      }
    });
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
// getDetailAxCode();
Notification();

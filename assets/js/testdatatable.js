$(document).ready(function () {
  //* fill data in table
  let all_table = $("table.display").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "30vh",
  });

  let export_table = $("table.export-table").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "30vh",
    layout: {
      topStart: {
        // buttons: ["copy", "csv", "excel", "pdf", "print"],
        buttons: [
          {
            extend: "csvHtml5",
            text: "Export CSV",
            className: "btn dark", // Add custom class here
          },
        ],
      },
    },
  });

  // adjust column width in modal
  $(document).on("shown.bs.modal", ".modal", function () {
    all_table.columns.adjust().draw();
    export_table.columns.adjust().draw();
  });
  //* button fuction
  // open modal management

  //******************************************************** Page: Master Project
  $("#btnPJadd").on("click", function () {
    $("#modalPJmanagement").removeClass("d-none");
  });
  $("#btnPJedit").on("click", function () {
    $("#modalPJmanagement").removeClass("d-none");
  });
  $("#tablePJmaster tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnPJedit, #btnPJdel").addClass("d-none");
      $("#modalPJmanagement").addClass("d-none");
    } else {
      $("#tablePJmaster tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnPJedit, #btnPJdel").removeClass("d-none");
      // $("#modalPJmanagement").removeClass("d-none");

      
    }
  });

  //******************************************************** Page: Project Revise
  $("#btnPJReviseAdd").on("click", function () {
    $("#modalPJRevisemanagement").removeClass("d-none");
  });

  $("#btnUpload").on("click", function () {
    $("#fileUpload").click();
  });
  $("#btnPJReviseEdit").on("click", function () {
    $("#modalPJRevisemanagement").removeClass("d-none");
  });
  $("#tablePJrevise tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnPJReviseDoc,#btnPJReviseEdit, #btnPJReviseDel").addClass("d-none");
      $("#modalPJRevisemanagement").addClass("d-none");
    } else {
      $("#tablePJrevise tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnPJReviseDoc,#btnPJReviseEdit, #btnPJReviseDel").removeClass("d-none");
    }
  });

  //******************************************************** Page: Revise history

  $("#btnPrintDoc").unbind();
  $("#btnPrintDoc").on("click", function () {
    printPageArea("", "pdfViewer");
    // window.print()
  });

  $("#tableHisRevise tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnHisReviseDoc,#btnHisPrint").addClass("d-none");
      $("#modalPrintHistory").modal("hide");
    } else {
      $("#tableHisRevise tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnHisReviseDoc,#btnHisPrint").removeClass("d-none");
      $("#modalPrintHistory").modal("hide");
    }
  });

  $("#btnHisPrint").unbind();
  $("#btnHisPrint").on("click", function () {
    $("#modalPrintHistory").modal("show");
  });

  //******************************************************** Page: PPC
  $("#tableReqPPC tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnPPCedit, #btnPPCdel").addClass("d-none");
    } else {
      $("#tableReqPPC tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnPPCedit, #btnPPCdel").removeClass("d-none");
    }
  });

  // $("#toggle_show_customers").on("click", function () {
  //   // console.log($(this).parent().addClass("active"));
  //   let msg_title = $(".show-customer").hasClass("d-none") ? "Not Show" : "Show";
  //   const Toast = Swal.mixin({
  //     toast: true,
  //     position: "top-end",
  //     showConfirmButton: false,
  //     width: "200px",
  //     timer: 1500,
  //     timerProgressBar: true,
  //     // didOpen: (toast) => {
  //     //   toast.onmouseenter = Swal.stopTimer;
  //     //   toast.onmouseleave = Swal.resumeTimer;
  //     // }
  //   });
  //   Toast.fire({
  //     title: msg_title,
  //   });
  //   $(".show-customer,.not-show-customer").toggleClass("d-none");
  // });

  //******************************************************** Page: ECN
  $("#tableReqECN tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnECNedit, #btnECNdel").addClass("d-none");
      // $("#modalPJRevisemanagement").addClass("d-none");
    } else {
      $("#tableReqECN tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnECNedit, #btnECNdel").removeClass("d-none");
    }
  });
});

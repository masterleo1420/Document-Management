$(document).on("click", ".btnTestSign", function () {
  let _this = $(this);
  let title = _this.attr("swal-title");
  let default_name = $(".show-user-name").html();

  let default_date = getCurrentDate();
  console.log(default_date);
  Swal.fire({
    title: title,
    html: `
      <div class="form-group row w-100">
        <label class="col-sm-2 form-control-label">Username</label>
        <div class="col-sm-10">
          <input type="text" class="form-control" id="inputSignUsername" autocomplete="off" value=""/>
        </div>
      </div>
      <div class="form-group row w-100">
        <label class="col-sm-2 form-control-label">Password</label>
        <div class="col-sm-10">
          <input type="password" class="form-control" id="inputSignPassword" autocomplete="off" value="${default_name}"/>
        </div>
      </div>
      <div class="form-group row w-100">
        <label class="col-sm-2 form-control-label">Date</label>
        <div class="col-sm-10">
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
      const name = $("#inputSignName").val();
      const date = $("#inputSignDate").val();

      // Validate input (optional)
      if (!name || !date) {
        name = "";
        date = "";
      }

      // Process form data (send to server, etc.)
      return {
        name: name,
        date: date,
      };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      let signBy = `${result.value.name} ${result.value.date}`;
      console.log("Submitted data:", result.value);
      // Handle successful form submission (e.g., send data to server)
    }
  });
});

// swal delete
$(document).on("click", ".btnDelete", function () {
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
    }
  });
});

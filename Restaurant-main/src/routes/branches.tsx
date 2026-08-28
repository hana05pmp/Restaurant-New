import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";


export const Route = createFileRoute("/branches")({
  component: BranchPage,
});



type Branch = {
  storeNumber:number;
  city:string;
  state:string;
  region:string;
  type?:string;
  loyalty?:string;
};



function BranchPage(){

  const navigate = useNavigate();


  const {
    adminUser,
    currentRole
  } = useStore();



  const [branch,setBranch] = useState<Branch | null>(null);

  const [loading,setLoading] = useState(true);




  useEffect(()=>{


    if(!adminUser){

      navigate({
        to:"/login",
        replace:true
      });

      return;

    }



    if(currentRole !== "branch_manager"){

      navigate({
        to:"/admin",
        replace:true
      });

      return;

    }



    fetch(
      "http://127.0.0.1:8000/api/branches"
    )


    .then(res=>res.json())


    .then(data=>{


      console.log("USER:",adminUser);

      console.log("BRANCH API:",data);



      const currentBranch =
        data.find(
          (b:Branch)=>
            String(b.storeNumber) ===
            String(adminUser.branchId)
        );



      console.log(
        "FOUND BRANCH:",
        currentBranch
      );



      setBranch(currentBranch || null);


    })


    .catch(err=>{

      console.log(err);

    })


    .finally(()=>{

      setLoading(false);

    });



  },[
    adminUser,
    currentRole,
    navigate
  ]);






  if(loading){

    return (

      <div className="
      min-h-screen
      grid
      place-items-center
      ">

        Loading Branch Dashboard...

      </div>

    );

  }






  return (

    <div className="
    min-h-screen
    bg-muted/30
    p-8
    ">


      <h1 className="
      text-4xl
      font-bold
      ">

        BRANCH DASHBOARD

      </h1>





      <div className="
      mt-6
      rounded-xl
      border
      bg-card
      p-6
      ">



        <h2 className="
        text-2xl
        font-semibold
        ">

          {branch?.city || "Unknown Branch"}

        </h2>



        <div className="
        mt-3
        space-y-2
        text-muted-foreground
        ">


          <p>
            State:
            {" "}
            {branch?.state || "-"}
          </p>



          <p>
            Region:
            {" "}
            {branch?.region || "-"}
          </p>




          <p>
            Manager:
            {" "}
            {adminUser?.name}
          </p>



          <p>
            Branch ID:
            {" "}
            {adminUser?.branchId}
          </p>



        </div>



      </div>


    </div>

  );

}
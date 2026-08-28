import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

import { useEffect } from "react";

import { useStore } from "@/lib/store";

import { BranchShellProvider } from "@/components/branch-admin/BranchShell";

import { getUnauthorizedRedirect } from "@/lib/auth";



export const Route = createFileRoute("/branch-manager")({

  head: () => ({
    meta: [
      {
        title:"Branch Manager — Ember & Oak"
      },
      {
        name:"description",
        content:
        "Branch operations console for Ember & Oak restaurant managers."
      },
      {
        name:"robots",
        content:"noindex"
      }
    ],
  }),


  component: BranchManagerLayout,

});




function BranchManagerLayout(){


const pathname = useRouterState({

select:(s)=>s.location.pathname

});


const {
 adminUser,
 currentRole

}=useStore();



const navigate = useNavigate();





useEffect(()=>{


const redirect =
getUnauthorizedRedirect(
 currentRole,
 pathname
);



if(redirect && redirect !== pathname){

navigate({

to:redirect,

replace:true

});

}


},[
currentRole,
pathname,
navigate
]);





if(!adminUser){


return (

<div className="
grid
min-h-screen
place-items-center
">

Redirecting...

</div>

);


}




return (

<BranchShellProvider>

<Outlet/>

</BranchShellProvider>

);


}
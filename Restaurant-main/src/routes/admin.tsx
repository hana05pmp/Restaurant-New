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


export const Route = createFileRoute("/admin")({

  head: () => ({
    meta:[
      {
        title:"Main Admin — Ember & Oak"
      },
      {
        name:"description",
        content:
        "HQ operations console for Ember & Oak restaurant chain."
      },
      {
        name:"robots",
        content:"noindex"
      }
    ],
  }),

  component:AdminLayout,

});




function AdminLayout(){


const pathname =
useRouterState({
 select:(s)=>s.location.pathname
});



const {
 adminUser,
 currentRole
}=useStore();



const navigate = useNavigate();




useEffect(()=>{


if(
 pathname === "/admin/login"
){
 return;
}



if(!adminUser){


navigate({

to:"/login",

replace:true

});


return;

}



const redirect =
getUnauthorizedRedirect(
currentRole,
pathname
);



if(
redirect &&
redirect !== pathname
){


navigate({

to:redirect,

replace:true

});


}



},[
pathname,
adminUser,
currentRole,
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
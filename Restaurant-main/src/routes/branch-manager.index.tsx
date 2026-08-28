import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useBranchShell } from "@/components/branch-admin/BranchShell";

import {
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  MapPin
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";



export const Route = createFileRoute("/branch-manager/")({
  component: BranchDashboard,
});



type Branch = {

  storeNumber:number;

  city:string;

  state:string;

  region:string;

  type?:string;

  loyalty?:string;

};





type Analytics = {


  orders:number;


  revenue:number;


  customers:number;


  growth:number;



  weekly_sales:{

    day:string;

    sales:number;

  }[];




  inventory_usage:{

    ingredient:string;

    used:number;

    unit:string;

    beforeStock:number;

    remaining:number;

    orderId:string;

    date:string;

  }[];


};







function BranchDashboard(){



const {
  adminUser
}=useStore();
const { activeBranchId } = useBranchShell();
const branchId = adminUser?.role === "branch_manager" ? adminUser.branchId : activeBranchId;





const [branch,setBranch]=
useState<Branch|null>(null);





const [analytics,setAnalytics]=
useState<Analytics|null>(null);





const [loading,setLoading]=
useState(true);








useEffect(()=>{



if(!adminUser || !branchId) return;





Promise.all([



fetch(
"http://127.0.0.1:8000/api/branches"
)
.then(res=>res.json()),






fetch(

`http://127.0.0.1:8000/api/branch/dashboard/${branchId}`

)

.then(res=>res.json())



])



.then(([branches,analyticsData])=>{



const currentBranch =

branches.find(

(b:Branch)=>

String(b.branchId ?? b.storeNumber)

===

String(branchId)

);





setBranch(currentBranch);





setAnalytics(analyticsData);





console.log(
"BRANCH",
currentBranch
);





console.log(
"ANALYTICS",
analyticsData
);





})



.catch(err=>{


console.log(err);


})



.finally(()=>{


setLoading(false);


});





},[adminUser, branchId]);







if(loading){


return (


<div className="
min-h-screen
grid
place-items-center
text-muted-foreground
">


Loading Dashboard...


</div>


);


}







return (



<div className="
min-h-screen
bg-muted/30
p-8
space-y-8
">





<div>


<h1 className="
text-5xl
font-bold
">

Branch Analytics Dashboard

</h1>



<p className="
mt-2
text-muted-foreground
">

Real-time branch performance overview

</p>


</div>






{/* KPI */}



<div className="
grid
gap-5
md:grid-cols-4
">



<KpiCard

title="Today's Orders"

value={

analytics?.orders?.toLocaleString() || "0"

}

icon={<ShoppingBag/>}

/>




<KpiCard

title="Revenue"

value={

`$${analytics?.revenue?.toLocaleString() || 0}`

}

icon={<DollarSign/>}

/>




<KpiCard

title="Customers"

value={

analytics?.customers?.toLocaleString() || "0"

}

icon={<Users/>}

/>




<KpiCard

title="Growth"

value={

`+${analytics?.growth || 0}%`

}

icon={<TrendingUp/>}

/>



</div>
      {/* BRANCH INFO + PERFORMANCE */}

      <div className="
      grid
      gap-6
      lg:grid-cols-2
      ">



      {/* Branch Information */}


      <Card>


      <CardHeader>

      <CardTitle>
      Branch Information
      </CardTitle>

      </CardHeader>



      <CardContent
      className="
      space-y-4
      "
      >



      <div className="
      flex
      items-center
      gap-4
      ">


      <MapPin size={32}/>


      <div>

      <h2 className="
      text-2xl
      font-bold
      uppercase
      ">

      {
      branch?.city || "Unknown"
      }

      </h2>


      <p>

      {
      branch?.state || "-"
      }

      </p>


      </div>


      </div>





      <p>

      Region:

      <b>
      {" "}
      {
      branch?.region || "-"
      }
      </b>

      </p>





      <p>

      Manager:

      <b>
      {" "}
      {
      adminUser?.name
      }
      </b>

      </p>





      <p>

      Store:

      <b>
      {" "}
      {
      adminUser?.branchId
      }
      </b>

      </p>




      </CardContent>


      </Card>








      {/* Performance */}



      <Card>


      <CardHeader>

      <CardTitle>
      Performance Summary
      </CardTitle>

      </CardHeader>



      <CardContent
      className="
      space-y-5
      "
      >


      <ProgressBar

      title="Customer Satisfaction"

      value="85%"

      />



      <ProgressBar

      title="Operational Score"

      value="92%"

      />



      </CardContent>


      </Card>



      </div>









      {/* SALES CHART */}



      <Card>


      <CardHeader>

      <CardTitle>
      Weekly Sales Trend
      </CardTitle>

      </CardHeader>




      <CardContent>


      <div className="
      h-[320px]
      ">


      <ResponsiveContainer

      width="100%"

      height="100%"

      >


      <LineChart

      data={
      analytics?.weekly_sales || []
      }

      >


      <CartesianGrid
      strokeDasharray="3 3"
      />



      <XAxis

      dataKey="day"

      />



      <YAxis/>




      <Tooltip/>




      <Line

      type="monotone"

      dataKey="sales"

      stroke="#f97316"

      strokeWidth={3}

      />



      </LineChart>


      </ResponsiveContainer>


      </div>



      </CardContent>


      </Card>









      {/* INVENTORY USAGE */}



      <Card>


      <CardHeader>

      <CardTitle>
      Recent Stock Usage
      </CardTitle>

      </CardHeader>



      <CardContent>


      <div className="
      space-y-4
      ">


      {

      analytics?.inventory_usage?.length ? (


      analytics.inventory_usage.map((item,index)=>(


      <div

      key={index}

      className="
      flex
      justify-between
      items-center
      border-b
      pb-3
      "

      >



      <div>


      <p className="
      font-semibold
      ">

      {item.ingredient}

      </p>


      <p className="
      text-sm
      text-muted-foreground
      ">

      Used:

      {" "}

      {item.used}

      {" "}

      {item.unit}


      </p>


      </div>





      <div className="
      text-right
      ">


      <p className="
      text-sm
      text-muted-foreground
      ">

      Remaining

      </p>



      <p className="
      font-bold
      ">

      {item.remaining}

      {" "}

      {item.unit}


      </p>


      </div>



      </div>



      ))


      ):(


      <p className="
      text-muted-foreground
      ">

      No inventory usage yet

      </p>


      )


      }


      </div>


      </CardContent>


      </Card>






      </div>


  );


}








function KpiCard({

title,

value,

icon


}:{

title:string;

value:string;

icon:React.ReactNode;

}){



return (


<Card>


<CardContent className="p-6">


<div className="
flex
items-center
justify-between
">


<div>


<p className="
text-sm
text-muted-foreground
">

{title}

</p>



<h2 className="
text-3xl
font-bold
">

{value}

</h2>


</div>




<div className="
rounded-xl
bg-orange-100
p-3
text-orange-600
">


{icon}


</div>



</div>


</CardContent>


</Card>


);


}









function ProgressBar({

title,

value


}:{

title:string;

value:string;

}){



return (


<div>



<div className="
flex
justify-between
mb-2
">


<span>

{title}

</span>



<span className="
font-bold
">

{value}

</span>


</div>





<div className="
h-3
rounded-full
bg-muted
overflow-hidden
">


<div

className="
h-full
rounded-full
bg-orange-500
"


style={{

width:value

}}


/>



</div>




</div>


);


}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useBranchShell } from "@/components/branch-admin/BranchShell";

import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp
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





export const Route = createFileRoute(
  "/branch-manager/sales-reports"
)({

  head:()=>({

    meta:[
      {
        title:"Sales Reports — Branch Manager"
      },

      {
        name:"robots",
        content:"noindex"
      }

    ]

  }),


  component:SalesReport

});







type Report = {


  todaySales:number;


  totalSales:number;


  totalOrders:number;


  itemsSold:number;


  averageOrderValue:number;



  weeklySales:{

    day:string;

    sales:number;

  }[];




  topMenus:{

    name:string;

    quantity:number;

  }[];


};









function SalesReport(){


const {adminUser}=useStore();
const { activeBranchId } = useBranchShell();
const branchId = adminUser?.role === "branch_manager" ? adminUser.branchId : activeBranchId;



const [report,setReport]=
useState<Report|null>(null);



const [loading,setLoading]=
useState(true);







useEffect(()=>{


if(!branchId)
return;




fetch(

`http://127.0.0.1:8000/api/branch/sales-report/${branchId}`

)


.then(res=>res.json())


.then(data=>{


console.log(
"SALES REPORT",
data
);


setReport(data);


})


.catch(err=>{


console.log(err);


})


.finally(()=>{


setLoading(false);


});



},[adminUser]);









if(loading){


return (

<div className="p-8">

Loading sales report...

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
text-4xl
font-bold
">

Sales Report

</h1>



<p className="
text-muted-foreground
">

Branch performance analytics

</p>




<p className="
text-sm
text-primary
">

Branch ID: {adminUser?.branchId}

</p>


</div>









{/* KPI CARDS */}



<div className="
grid
gap-5
md:grid-cols-5
">







<Kpi

title="Tdy's Sales"

value={

`$${

report?.todaySales?.toFixed(2)

||

"0.00"

}`

}

icon={<DollarSign/>}

/>








<Kpi

title="Total Sales"

value={

`$${

report?.totalSales?.toFixed(2)

||

"0.00"

}`

}

icon={<DollarSign/>}

/>









<Kpi

title="Total Orders"

value={

String(

report?.totalOrders

||

0

)

}

icon={<ShoppingBag/>}

/>









<Kpi

title="Items Sold"

value={

String(

report?.itemsSold

||

0

)

}

icon={<Package/>}

/>









<Kpi

title="Avrg Orders"

value={

`$${

report?.averageOrderValue?.toFixed(2)

||

"0.00"

}`

}

icon={<TrendingUp/>}

/>






</div>









{/* WEEKLY SALES */}





<Card>


<CardHeader>

<CardTitle>

Weekly Sales

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

report?.weeklySales || []

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













{/* TOP MENU */}





<Card>


<CardHeader>

<CardTitle>

Top Selling Menu

</CardTitle>


</CardHeader>





<CardContent>


<div className="space-y-4">





{

report?.topMenus &&

report.topMenus.length > 0

?

report.topMenus.map((item,index)=>(



<div

key={index}

className="
flex
justify-between
rounded-xl
border
p-4
"

>



<div>


<p className="
font-semibold
">

{item.name}

</p>



<p className="
text-sm
text-muted-foreground
">

Sold quantity

</p>


</div>





<div className="
text-xl
font-bold
">


{item.quantity}

<span className="
text-sm
font-normal
ml-2
">

pcs

</span>



</div>





</div>



))


:



<p className="
text-muted-foreground
">

No sales data available

</p>



}




</div>


</CardContent>


</Card>









</div>


);

}













function Kpi({

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
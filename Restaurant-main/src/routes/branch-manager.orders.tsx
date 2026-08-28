import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { ImageIcon } from "lucide-react";
import { useBranchShell } from "@/components/branch-admin/BranchShell";

export const Route = createFileRoute("/branch-manager/orders")({

  head: () => ({
    meta:[
      {
        title:"Live Orders — Branch Manager",
      }
    ],
  }),

  component: BranchManagerOrders,

});





function BranchManagerOrders(){


  const { adminUser } = useStore();
  const { activeBranchId } = useBranchShell();


  const [orders,setOrders] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);



  const branchId = adminUser?.role === "branch_manager" ? adminUser.branchId : activeBranchId;



  useEffect(()=>{


    if(!branchId){
      setLoading(false);
      return;
    }


    async function loadOrders(){
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/orders/${branchId}`
        );
        if (!response.ok) throw new Error("Unable to load branch orders");
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
    const timer = setInterval(loadOrders, 5000);
    return () => clearInterval(timer);


  },[branchId]);





  async function confirmOrder(id:string){


    await fetch(

      `http://127.0.0.1:8000/api/orders/${id}/confirm`,

      {
        method:"PUT"
      }

    );


    const response = await fetch(
      `http://127.0.0.1:8000/api/orders/${branchId}`
    );
    setOrders(await response.json());

  }





  if(loading){

    return <div className="p-6">
      Loading orders...
    </div>

  }




  return (

    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">


      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="text-sm font-semibold text-primary">🔒 Branch Manager View</div>

        <div className="text-xs text-muted-foreground">Live orders from your branch</div>
      </div>




      <div className="rounded-2xl border bg-card">
        <div className="p-5">
          <h1 className="text-xl font-bold">Live Orders</h1>

          <p className="text-sm text-muted-foreground">{orders.length} orders</p>
        </div>




        <div className="divide-y">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No orders for this branch yet.</div>
          ) : orders.map((order) => {
            const orderId = order.id || order._id;

            return (
<div
key={orderId}
className="
p-5
space-y-4
"
>


<div className="
flex
justify-between
items-start
">


<div>


<div className="font-semibold">

#{String(orderId).slice(-6)}

</div>


<p className="text-sm text-muted-foreground">

{order.items?.length ?? 0} items

</p>


</div>




<div className="flex items-center gap-3">


<span
className="
rounded-full
bg-orange-100
px-3
py-1
text-sm
text-orange-600
"
>

{order.status}

</span>


{
order.status==="pending"

&&

<button

onClick={()=>confirmOrder(orderId)}

className="
rounded-lg
bg-primary
px-4
py-2
text-white
"

>

Confirm

</button>

}



</div>


</div>







{/* MENU ITEMS */}


<div className="
grid
gap-3
md:grid-cols-2
"
>


{
order.items?.map((item:any,index:number)=>(


<div

key={index}

className="
flex
items-center
gap-4
rounded-xl
border
p-3
"


>


{/* IMAGE */}


<div className="
h-16
w-16
rounded-lg
bg-muted
flex
items-center
justify-center
overflow-hidden
">


{
item.image

?


<img

src={item.image}

className="
h-full
w-full
object-cover
"

/>


:


<ImageIcon
className="text-muted-foreground"
/>

}



</div>







<div>


<p className="font-semibold">

{item.menu_name || item.name || "Unknown Menu"}

</p>


<p className="text-sm text-muted-foreground">

Qty:
{" "}
{item.quantity}

</p>



<p className="text-sm">

${item.unit_price || item.price || 0}

</p>



</div>



</div>



))


}


</div>







<div className="
text-right
font-bold
border-t
pt-3
">


Total:

{" "}

${order.total_amount || order.total || 0}


</div>



</div>

        )
          })}


        </div>


      </div>


    </div>

  );

}
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({

  head: () => ({
    meta: [
      {
        title: "Your Order — Ember & Oak",
      },
    ],
  }),

  component: CartPage,

});

function CartPage(){
  const {
    items,

increase,

decrease,

removeItem,

clearCart,

}=useCart();





const itemCount =
items.reduce(
(sum,item)=>
sum + item.quantity,
0
);

  const total = items.reduce(

(sum,item)=>

sum +
(
Number(item.dish.price ?? 0)
*
item.quantity
),

0

);

return (

<SiteLayout>


<main className="
mx-auto
max-w-5xl
px-4
py-10
md:px-6
">


<div className="
flex
items-center
gap-3
">


<Link

to="/menu"

className="
inline-flex
size-10
items-center
justify-center
rounded-full
border
"

>


<ArrowLeft
className="size-4"
/>


</Link>



<div>


<p className="
text-xs
font-semibold
uppercase
tracking-[0.3em]
text-primary
">

Ember & Oak

</p>


<h1 className="
mt-1
font-display
text-4xl
">

Your Order

</h1>


</div>


</div>


{
items.length === 0 ?
          <div
            className="
mt-12
rounded-2xl
border
border-dashed
p-12
text-center
">


<ShoppingBag

className="
mx-auto
size-10
text-muted-foreground
"

/>



<h2 className="
mt-4
text-lg
font-semibold
">

Your order is empty

</h2>



<p className="
mt-2
text-sm
text-muted-foreground
">

Add something delicious from the menu.

</p>



<Link

to="/menu"

className="
mt-6
inline-flex
rounded-full
bg-primary
px-5
py-3
font-semibold
text-primary-foreground
"

>

Browse Menu

</Link>



</div>



:





<div className="
mt-8
grid
gap-6
lg:grid-cols-[1fr_320px]
">





<section className="
space-y-4
">



{
items.map((item)=>(



<div

key={item.dish.id}

className="
flex
gap-4
rounded-2xl
border
bg-card
p-4
"

>





<div className="
flex
size-20
shrink-0
items-center
justify-center
rounded-xl
bg-muted
overflow-hidden
">


{
item.dish.image ?



<img

src={item.dish.image}

alt={item.dish.name}

className="
h-full
w-full
object-cover
"

/>



:



<span className="text-3xl">

🍽️

</span>


}



</div>









<div className="
flex-1
">


<div className="
flex
justify-between
gap-3
">


<div>


<h3 className="
font-semibold
">

{item.dish.name}

</h3>



<p className="
mt-1
text-xs
text-muted-foreground
">

{item.dish.description}

</p>



<p className="
mt-2
font-semibold
text-primary
">

$

{
Number(item.dish.price ?? 0)
.toFixed(2)
}

</p>



</div>





<button

type="button"

onClick={()=>removeItem(item.dish.id)}

className="
text-muted-foreground
hover:text-destructive
"

>


<Trash2 size={18}/>


</button>



</div>









<div className="
mt-4
flex
items-center
justify-between
">



<div className="
flex
items-center
rounded-full
border
">


<button

type="button"

onClick={()=>decrease(item.dish.id)}

className="
size-9
flex
items-center
justify-center
hover:bg-muted
"

>

<Minus size={16}/>

</button>





<span className="
w-10
text-center
font-semibold
">

{item.quantity}

</span>





<button

type="button"

onClick={()=>increase(item.dish.id)}

className="
size-9
flex
items-center
justify-center
hover:bg-muted
"

>

<Plus size={16}/>

</button>




</div>




<div className="font-semibold">


$

{
(
Number(item.dish.price ?? 0)
*
item.quantity
)
.toFixed(2)
}


</div>



</div>




</div>



</div>



))

}






<button

type="button"

onClick={clearCart}

className="
text-sm
font-medium
text-destructive
hover:underline
"

>

Clear order

</button>




</section>









<aside className="
h-fit
rounded-2xl
border
bg-card
p-5
">


<h2 className="
text-lg
font-semibold
">

Order Summary

</h2>





<div className="
mt-5
space-y-3
text-sm
">


<div className="
flex
justify-between
">

<span className="text-muted-foreground">

Items

</span>


<span>

{itemCount}

</span>


</div>
<div className="
flex
justify-between
border-t
pt-3
">
<span>
Total
</span>
<span className="
font-bold
text-primary
">
${total.toFixed(2)}
</span>
</div>
</div>
<Link

to="/checkout"

className="
mt-6
block
w-full
rounded-full
bg-primary
px-4
py-3
text-center
font-semibold
text-primary-foreground
"
>
Checkout
</Link>
</aside>
</div>



}



</main>


</SiteLayout>


);


}
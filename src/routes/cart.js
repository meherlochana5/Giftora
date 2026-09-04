const express=require('express');
const pool=require('../../db');
const {requireAuth}=require('../middleware/auth');
const router=express.Router();

router.get('/',requireAuth,async(req,res,next)=>{
  try{
    const [rows]=await pool.query(`SELECT c.product_id,c.quantity,p.name,p.price,p.stock,p.image_url,
      (c.quantity*p.price) subtotal FROM cart c JOIN products p ON c.product_id=p.id WHERE c.user_id=?`,[req.user.id]);
    res.json(rows);
  }catch(e){next(e);}
});

router.post('/',requireAuth,async(req,res,next)=>{
  try{
    const {productId,quantity=1}=req.body;
    const qty=Number(quantity);

    const [p]=await pool.query(
      'SELECT id,stock FROM products WHERE id=?',
      [productId]
    );

    if(!p.length){
      return res.status(404).json({
        message:'Product not found.'
      });
    }

    if(p[0].stock<qty){
      return res.status(400).json({
        message:'Not enough stock.'
      });
    }

    const [existing]=await pool.query(
      'SELECT quantity FROM cart WHERE user_id=? AND product_id=?',
      [req.user.id,productId]
    );

    if(existing.length){

      const newQuantity=Math.min(
        existing[0].quantity+qty,
        p[0].stock
      );

      await pool.query(
        'UPDATE cart SET quantity=? WHERE user_id=? AND product_id=?',
        [newQuantity,req.user.id,productId]
      );

    }else{

      await pool.query(
        'INSERT INTO cart(user_id,product_id,quantity) VALUES(?,?,?)',
        [req.user.id,productId,qty]
      );

    }

    res.json({
      message:'Added to cart.'
    });

  }catch(e){
    next(e);
  }
});
router.put('/:productId',requireAuth,async(req,res,next)=>{
  try{
    const q=Number(req.body.quantity);
    if(q<1)return res.status(400).json({message:'Quantity must be at least 1.'});
    const [p]=await pool.query('SELECT stock FROM products WHERE id=?',[req.params.productId]);
    if(!p.length||p[0].stock<q)return res.status(400).json({message:'Requested quantity is unavailable.'});
    await pool.query('UPDATE cart SET quantity=? WHERE user_id=? AND product_id=?',[q,req.user.id,req.params.productId]);
    res.json({message:'Cart updated.'});
  }catch(e){next(e);}
});

router.delete('/:productId',requireAuth,async(req,res,next)=>{
  try{await pool.query('DELETE FROM cart WHERE user_id=? AND product_id=?',[req.user.id,req.params.productId]);res.json({message:'Removed from cart.'});}
  catch(e){next(e);}
});

module.exports=router;

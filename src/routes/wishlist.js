const express=require('express');
const pool=require('../../db');
const {requireAuth}=require('../middleware/auth');
const router=express.Router();

router.get('/',requireAuth,async(req,res,next)=>{
  try{
    const [rows]=await pool.query(`SELECT p.*,c.name category_name,o.name occasion_name
      FROM wishlist w JOIN products p ON w.product_id=p.id JOIN categories c ON p.category_id=c.id
      LEFT JOIN occasions o ON p.occasion_id=o.id WHERE w.user_id=? ORDER BY w.id DESC`,[req.user.id]);
    res.json(rows);
  }catch(e){next(e);}
});

router.post('/:productId',requireAuth,async(req,res,next)=>{
  try{
    await pool.query('INSERT IGNORE INTO wishlist(user_id,product_id) VALUES(?,?)',[req.user.id,req.params.productId]);
    res.json({message:'Added to wishlist.'});
  }catch(e){next(e);}
});

router.delete('/:productId',requireAuth,async(req,res,next)=>{
  try{await pool.query('DELETE FROM wishlist WHERE user_id=? AND product_id=?',[req.user.id,req.params.productId]);res.json({message:'Removed from wishlist.'});}
  catch(e){next(e);}
});

module.exports=router;

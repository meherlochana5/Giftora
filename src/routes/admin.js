const express=require('express');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const pool=require('../../db');
const {requireAdmin}=require('../middleware/auth');
const {sendEmail}=require('../utils/email');

const router=express.Router();
const upload=multer({
  storage:multer.diskStorage({
    destination:(req,file,cb)=>cb(null,path.join(__dirname,'..','..','uploads')),
    filename:(req,file,cb)=>cb(null,Date.now()+path.extname(file.originalname))
  }),
  limits:{fileSize:2*1024*1024},
  fileFilter:(req,file,cb)=>cb(null,/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))
});

router.get('/dashboard',requireAdmin,async(req,res,next)=>{
  try{
    const [[products]]=await pool.query('SELECT COUNT(*) count FROM products');
    const [[orders]]=await pool.query('SELECT COUNT(*) count FROM orders');
    const [[pending]]=await pool.query('SELECT COUNT(*) count FROM orders WHERE status="PENDING"');
    const [[confirmed]]=await pool.query('SELECT COUNT(*) count FROM orders WHERE status="CONFIRMED"');
    const [[shipped]]=await pool.query('SELECT COUNT(*) count FROM orders WHERE status IN ("SHIPPED","OUT_FOR_DELIVERY")');
    const [[delivered]]=await pool.query('SELECT COUNT(*) count FROM orders WHERE status="DELIVERED"');
    const [categoryStats]=await pool.query(`SELECT c.name,
      COUNT(p.id) total_products,
      SUM(CASE WHEN p.stock>0 THEN 1 ELSE 0 END) available_products,
      SUM(CASE WHEN p.stock=0 THEN 1 ELSE 0 END) out_of_stock_products
      FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.name`);
    const [outOfStock]=await pool.query(`SELECT p.id,p.name,c.name category_name,p.price,p.stock
      FROM products p JOIN categories c ON p.category_id=c.id WHERE p.stock=0 ORDER BY c.name,p.name`);
    const [lowStock]=await pool.query(`SELECT p.id,p.name,c.name category_name,p.price,p.stock
      FROM products p JOIN categories c ON p.category_id=c.id WHERE p.stock BETWEEN 1 AND 5 ORDER BY p.stock`);
    res.json({stats:{products:products.count,orders:orders.count,pending:pending.count,confirmed:confirmed.count,shipped:shipped.count,delivered:delivered.count},categoryStats,outOfStock,lowStock});
  }catch(e){next(e);}
});

router.get('/products',requireAdmin,async(req,res,next)=>{
  try{
    const [rows]=await pool.query(`SELECT p.*,c.name category_name,o.name occasion_name FROM products p
      JOIN categories c ON p.category_id=c.id LEFT JOIN occasions o ON p.occasion_id=o.id ORDER BY p.id DESC`);
    res.json(rows);
  }catch(e){next(e);}
});

router.post('/products',requireAdmin,upload.single('image'),async(req,res,next)=>{
  try{
    const {name,description,price,categoryId,occasionId,stock}=req.body;
    if(!name||price===''||!categoryId)return res.status(400).json({message:'Name, price and category are required.'});
    const imageUrl=req.file?`/uploads/${req.file.filename}`:(req.body.imageUrl||'https://placehold.co/600x450?text=Giftora');
    const [r]=await pool.query(`INSERT INTO products(name,description,price,category_id,occasion_id,stock,image_url)
      VALUES(?,?,?,?,?,?,?)`,[name,description||'',Number(price),Number(categoryId),occasionId?Number(occasionId):null,Number(stock||0),imageUrl]);
    res.status(201).json({message:'Product added.',id:r.insertId});
  }catch(e){next(e);}
});

router.put('/products/:id',requireAdmin,upload.single('image'),async(req,res,next)=>{
  try{
    const {name,description,price,categoryId,occasionId,stock,imageUrl}=req.body;
    let sql=`UPDATE products SET name=?,description=?,price=?,category_id=?,occasion_id=?,stock=?`;
    const params=[name,description,Number(price),Number(categoryId),occasionId?Number(occasionId):null,Number(stock)];
    if(req.file){sql+=',image_url=?';params.push(`/uploads/${req.file.filename}`);}
    else if(imageUrl){sql+=',image_url=?';params.push(imageUrl);}
    sql+=' WHERE id=?';params.push(req.params.id);
    await pool.query(sql,params);
    res.json({message:'Product updated.'});
  }catch(e){next(e);}
});

router.delete('/products/:id',requireAdmin,async(req,res,next)=>{
  try{
    await pool.query('DELETE FROM products WHERE id=?',[req.params.id]);
    res.json({message:'Product deleted.'});
  }catch(e){next(e);}
});

router.get('/orders',requireAdmin,async(req,res,next)=>{
  try{
    const [orders]=await pool.query(`SELECT o.*,u.name customer_name,u.email customer_email
      FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC`);
    for(const o of orders){
      const [items]=await pool.query('SELECT * FROM order_items WHERE order_id=?',[o.id]);o.items=items;
    }
    res.json(orders);
  }catch(e){next(e);}
});

router.put('/orders/:id/status',requireAdmin,async(req,res,next)=>{
  try{
    const allowed=['PENDING','CONFIRMED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];
    const status=req.body.status;
    if(!allowed.includes(status))return res.status(400).json({message:'Invalid order status.'});
    const [before]=await pool.query(`SELECT o.*,u.email,u.name FROM orders o JOIN users u ON o.user_id=u.id WHERE o.id=?`,[req.params.id]);
    if(!before.length)return res.status(404).json({message:'Order not found.'});
    await pool.query('UPDATE orders SET status=? WHERE id=?',[status,req.params.id]);

    const labels={CONFIRMED:'confirmed',SHIPPED:'shipped',OUT_FOR_DELIVERY:'out for delivery',DELIVERED:'delivered',CANCELLED:'cancelled',PENDING:'pending'};
    await sendEmail(before[0].email,`Giftora Order Update #GIF${String(req.params.id).padStart(5,'0')}`,
      `Hi ${before[0].name}, your Giftora order #GIF${String(req.params.id).padStart(5,'0')} is now ${labels[status]}.`);
    res.json({message:'Order status updated.'});
  }catch(e){next(e);}
});

router.get('/users',requireAdmin,async(req,res,next)=>{
  try{
    const [rows]=await pool.query('SELECT id,name,email,phone,role,is_verified,created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  }catch(e){next(e);}
});

module.exports=router;

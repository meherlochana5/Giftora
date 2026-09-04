const express = require('express');
const pool = require('../../db');
const router = express.Router();

router.get('/', async (req,res,next) => {
  try {
    const { search='', category='', occasion='', minPrice='', maxPrice='' } = req.query;
    let sql = `SELECT p.*, c.name AS category_name, o.name AS occasion_name
               FROM products p JOIN categories c ON p.category_id=c.id
               LEFT JOIN occasions o ON p.occasion_id=o.id WHERE 1=1`;
    const params=[];
    if(search){ sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`,`%${search}%`); }
    if(category){ sql += ' AND c.name=?'; params.push(category); }
    if(occasion){ sql += ' AND o.name=?'; params.push(occasion); }
    if(minPrice !== ''){ sql += ' AND p.price>=?'; params.push(Number(minPrice)); }
    if(maxPrice !== ''){ sql += ' AND p.price<=?'; params.push(Number(maxPrice)); }
    sql += ' ORDER BY p.id DESC';
    const [rows]=await pool.query(sql,params);
    res.json(rows);
  } catch(e){next(e);}
});

router.get('/meta/options', async (req,res,next)=>{
  try{
    const [categories]=await pool.query('SELECT * FROM categories ORDER BY name');
    const [occasions]=await pool.query('SELECT * FROM occasions ORDER BY name');
    res.json({categories,occasions});
  }catch(e){next(e);}
});

router.get('/:id', async(req,res,next)=>{
  try{
    const [rows]=await pool.query(`SELECT p.*, c.name AS category_name, o.name AS occasion_name
      FROM products p JOIN categories c ON p.category_id=c.id
      LEFT JOIN occasions o ON p.occasion_id=o.id WHERE p.id=?`,[req.params.id]);
    if(!rows.length)return res.status(404).json({message:'Product not found.'});
    res.json(rows[0]);
  }catch(e){next(e);}
});

module.exports=router;

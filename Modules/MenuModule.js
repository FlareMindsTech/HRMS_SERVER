import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
    menuName:{
        type:String,
        required:true
    },
    menuCode:{
        type:String,
        required:true,
        unique:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    isBlock:{
        type:Boolean,
        default:false
    }
  },{
        timestamps:true
     });

const Menu = mongoose.model('Menu' , menuSchema);
export default Menu;
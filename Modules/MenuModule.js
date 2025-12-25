import mongoose from 'mongoose';

const toTitleCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const menuSchema = new mongoose.Schema({
    menuName:{
        type:String,
        required:true,
        set: toTitleCase
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
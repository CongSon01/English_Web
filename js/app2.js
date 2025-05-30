text="";
isdarktheme=true;

function Set(num){
    if(document.getElementById("a"+num).style.color=="var(--t_font_red)")
    {
        document.getElementById("a"+num).style.color="var(--t_font_notshown)";
    }
    else
    {
        document.getElementById("a"+num).style.color="var(--t_font_red)";
    }
}

function AllHide(){
    for(let i=0;i<900;i++){
        let num=i+1;
        try{
            document.getElementById("a"+num).style.color="var(--t_font_notshown)";
        }
        catch(e){

        }
        
    }
    
}


function AllShow(){
    for(let i=0;i<900;i++){
        let num=i+1;
        try{

            document.getElementById("a"+num).style.color="var(--t_font_red)";
        }
        catch(e){
            
        }
        
    }   
}
function AllStart(){
    for(let i=0;i<900;i++){
        let num=i+1;
        try{
            document.getElementById("a"+num).classList.add("blank");
            document.getElementById("a"+num).style.color="var(--t_font_red)";
        }
        catch(e){
            
        }
        
    }   
    var elements=document.getElementsByClassName("b");
    if(elements.length!=0){
        for(i=0;i<elements.length;i++){
            try{
                elements[i].style.color="var(--t_font_notshown)";
            }
            catch(e){
                
            }
        }
    }
}
// Spanがタップできる世界
function AllStart_S(){
    for(let i=0;i<900;i++){
        let num=i+1;
        try{
            document.getElementById("a"+num).classList.add("blank");
            if(document.getElementById("a"+num).getAttribute('onclick')==null){
                document.getElementById("a"+num).setAttribute('onclick', 'Set('+num+')');
            }
            document.getElementById("a"+num).style.color="var(--t_font_red)";
        }
        catch(e){

        } 
    }
    var elements=document.getElementsByClassName("b");
    if(elements.length!=0){
        for(let i=0;i<elements.length;i++){
            try{
                elements[i].style.color = "var(--t_font)";
            }
            catch(e){
                
            }
        }
    }
}
function DandL(){
    if (!isdarktheme) { // Dark
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        
    } else { // Light
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }
    isdarktheme=!isdarktheme;
    console.log(isdarktheme);
}
function CheckDL(){
    if(window.matchMedia('(prefers-color-scheme: dark)').matches == true){
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        isdarktheme=true;

    }else{
        isdarktheme=false;

    }
}


document.addEventListener('DOMContentLoaded', function(){
    AllStart_S();
    CheckDL();

});
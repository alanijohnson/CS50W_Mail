document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('','',''));
  


  // By default, load the inbox
  load_mailbox('inbox');
    
});

// Function to compose email
function compose_email(recipients,subject,body) {

  // get alert element
    var alert = document.querySelector('#compose-alert');
    alert.style.display = "None";
    
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
   
  // set form submit action
  document.querySelector('#compose-form').onsubmit = () => {
      console.log('send email');
          
      // Create email object
       var email = {
            recipients: document.querySelector('#compose-recipients').value,
            body: document.querySelector('#compose-body').value,
            subject: document.querySelector('#compose-subject').value,
       };
      
      console.log(email);
      
      // Post the email to send and load the sent mailbox.
      fetch('/emails',{
        method: "POST",
        body: JSON.stringify(email)
      })
      .then(response => {
        // response has an ok parameter to check if the response is okay
        // Not using it because I can access the errors directly after the
        // json is packaged.
        return response.json();
      })
      .then(result => {
        console.log(result);
        if (result.error){
            console.log(result.error);
            alert.innerHTML = result.error; // update banner messaging
            alert.style.display = "Block"; // show banner
            window.scrollTo(0, 0); // scroll to the top of the window to show error
        } else {
            console.log(result.message);
            load_mailbox('sent');
        }
      });
      
      event.preventDefault(); // prevent the page from refreshing to the root
      
  };
    
}

// Function to load mailbox given the mailbox as a string
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    
  // Get the users email
  var user_email = document.querySelector('#user-email').innerHTML;
  console.log(user_email);

  // Fetch the data from the server
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        
        // select the emails view div box to place email elements
        div = document.querySelector('#emails-view');
        // iterate over emails
        emails.forEach( function(email) {
            
//            // determine if the item should be in sent vs inbox/archive
//            if(mailbox == 'sent' & email.sender != user_email ){
//                console.log(email.id);
//                return;
//            }
//
//            // mail belongs in inbox/archive - ensure user is a recipient
//            if( mailbox !='sent' & !email.recipients.includes(user_email) ){
//                return;
//            }
//
//            // determine if the item belongs in archive or inbox
//            if(mailbox == 'archive' & !Boolean(email.archived)){
//                return;
//            }
//
//            if(mailbox == 'inbox' & Boolean(email.archived)){
//                return;
//            }
            
            // set the value of the archive button based on the status of the mailbox
            let archive = 'archive';
            if(mailbox == 'archive'){
                archive = 'unarchive'
            }
            
           // create the div element for email
           item = document.createElement('div');
           item.setAttribute('id', `email-${email.id}`);
           // set the oncliv for the entire div box to open the email details.
            item.onclick = function(){
                fetch(`/emails/${email.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                      read: true
                  })
                })
               .then( () => {
                   get_email(email.id);
               });
               
            }
            
           var email_address = mailbox == 'sent' ? email.recipients : email.sender;
           // style the box using classes and style
           item.className = 'list-group-item list-group-item-action flex-column align-items-start';
           item.style.color = "Black";
           // set contents of div box
           // div box contains two div flex boxes:
           // (1) Left Justifies Sender; Right Justifies Time recieved
           // (2) Left Justifies Subject; Right Justifies Archive/Unarchive button
           item.innerHTML = `<div class="d-flex w-100 justify-content-between"><strong>${email_address}</strong>${email.timestamp}</div><div class="d-flex w-100 justify-content-between"><p>${email.subject}</p><button id="div-archive-${email.id}" class='btn btn-primary' onclick='archive_swap(${email.id},"${mailbox}"); event.stopPropagation();'>${archive}</button></div>`;
           
            // configure div background style based on the read status
            if(email.read){
                item.className += ' list-group-item-secondary';
            } else {
                //item.style.backgroundColor = 'White';
            }
            
           // add dive element
           div.append(item);
            
           // hide archive button if on sent folder
           if(mailbox == 'sent'){
                console.log(`hide div-archive-${email.id}`);
                document.getElementById(`div-archive-${email.id}`).style.display = "None";
           }
        
        });
        
    });

}

// Function to render the singular email view.
function get_email(id) {
    
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    
    // fetch data from emails
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        // Print email
        console.log(email);

        document.querySelector('#email-from').innerHTML = email.sender;
        document.querySelector('#email-to').innerHTML = email.recipients;
        document.querySelector('#email-timestamp').innerHTML = email.timestamp;
        document.querySelector('#email-subject').innerHTML = email.subject;
        document.querySelector('#email-subject-header').innerHTML = email.subject;
        document.querySelector('#email-body').innerHTML = email.body;
        
        // Configure Reply button
        document.querySelector('#reply-button').onclick  = function() {
            
            rebuild_email('reply',email);
        };
        
        // Configure Forward button
        document.querySelector('#forward-button').onclick  = function() {
            
            rebuild_email('forward',email);
            
        };
        
        var button; // initialize button for set-up
        
        // Configure unread button
        button = document.querySelector('#unread-button');
        button.innerHTML = email.read ? "Mark as Unread" : "Mark as Read";
        button.onclick  = function() {
            swap_parameter('read',email.id);
        }
        
        // Configure unarchive button
        button = document.querySelector('#archive-button');
        button.innerHTML = email.archived ? "Un-archive" : "Archive";
        button.onclick  = function() {
            swap_parameter('archived',email.id);
        }
        // hide archive button if viewing a sent email
        // Get the users email
        var user_email = document.querySelector('#user-email').innerHTML;
        console.log(email.sender == user_email);
        console.log(email.recipients.includes(user_email));
        if (email.sender == user_email & !email.recipients.includes(user_email)){
            button.style.visibility = "hidden";
        } else{
            button.style.visibility = "visible";
        }
    });
    
    
    
    
}

// helper function to rebuild an email for replying and sending
function rebuild_email(type, email){
    
    // determine the prefix and sender for email based on type
    var prefix;
    var recipient = '';
    if (type == 'reply'){
        prefix = "Re:";
        recipient = email.sender;
    } else if (type == 'forward'){
        prefix = "Fw:";
    }
    
    // edit the subject to add the prefix to the front
    var subject = email.subject;
    if (!subject.startsWith(prefix)){
        subject = `${prefix} ${subject}`;
    }
    
    // compose the email with the proper fields filled in
    compose_email(recipient, subject, `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`);
    
    
}

// archive swap. Swap the current archive status
function archive_swap(id, mailbox){
    
    console.log(`Swap Archive Status of ${id}`);
    
    var archive_status;
    
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        archive_status = email.archived;
        console.log(email.archived);
        
        archive_status = !archive_status;
        console.log(archive_status);
        
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: archive_status
          })
        })
        .then(() => {
            load_mailbox(mailbox);
        });
       
    });
    
}

// generic parameter swap to swap the boolean value of any boolean parameter
function swap_parameter(parameter, id){
    
    // generic function to swap the status of a parameter
    console.log(`Swap ${parameter} Status of ${id}`);
    
    var parameter_status;
    
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        parameter_status = email[parameter];
        console.log(parameter_status);
        
        parameter_status = !parameter_status;
        console.log(parameter_status);
        
        //var map = `{${parameter}:${parameter_status}}`;
        //console.log(map);
        //console.log(JSON.stringify(map));
        
        var dict = {};
        dict[parameter] = parameter_status;
        console.log(dict);
        console.log(JSON.stringify(dict));
        
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify(dict)
        })
        .then(() => {
            console.log(id);
            get_email(id);
        });
       
    });
    
    
}


use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use base64::{prelude::BASE64_STANDARD, Engine};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use rand::distr::{Alphanumeric, SampleString};
use std::sync::{Arc, Mutex};

#[derive(Clone, Serialize, Deserialize)]
struct Captcha {
    id: String,
    captcha: String,
    // TODO: expires_in
}

impl Captcha {
    fn new() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            captcha: Alphanumeric.sample_string(&mut rand::rng(), 7),
        }
    }
}

struct CaptchaState {
    captchas: Arc<Mutex<Vec<Captcha>>>
}

#[get("/challenge")]
async fn get_challenge(captcha_data: web::Data<CaptchaState>) -> impl Responder {
    let captcha = Captcha::new();

    captcha_data.captchas.lock().unwrap().push(captcha.clone());
    HttpResponse::Ok().json(web::Json(Captcha {
        id: captcha.id,
        captcha: BASE64_STANDARD.encode(captcha.captcha)
    }))
}

#[post("/resolve")]
async fn resolve_challenge(data: web::Json<Captcha>, captcha_data: web::Data<CaptchaState>) -> impl Responder {
    let captchas = captcha_data.captchas.lock().unwrap().clone();

    for (i, captcha) in captchas.iter().enumerate() {
        if captcha.id == data.id {
            captcha_data.captchas.lock().unwrap().remove(i);
            if captcha.captcha == data.captcha {
                return HttpResponse::Ok().body("Captcha resolved");
            } else {
                return HttpResponse::BadRequest().body("Incorrect validity of captcha");
            }
        }
    }
    HttpResponse::NotFound().body("Captcha not found")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let captchas: Vec<Captcha> = Vec::new();

    let captcha_data = web::Data::new(CaptchaState {
        captchas: Arc::new(Mutex::new(captchas))
    });

    HttpServer::new({
        move || {
            App::new()
                .app_data(captcha_data.clone())
                .service(get_challenge)
                .service(resolve_challenge)
        }
    })
    .bind(("127.0.0.1", 8080))
    .unwrap()
    .run()
    .await
}

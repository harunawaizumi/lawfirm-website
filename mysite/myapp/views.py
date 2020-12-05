from django.shortcuts import render

# Create your views here.
def index(request):
	return render(None, 'index.html', {})

def office(request):
	return render(None, 'office.html', {})

def member(request):
	return render(None, 'member.html', {})

def access(request):
	return render(None, 'access.html', {})

def contact(request):
	return render(None, 'contact.html', {})